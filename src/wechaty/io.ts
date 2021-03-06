import { VERSION }      from '../config'

import {
  BehaviorSubject,
  Observable,
  Observer,
  Subject,
}                   from 'rxjs'
import {
  filter,
  share,
}                   from 'rxjs/operators'

import { Brolog }       from 'brolog'
import { StateSwitch }  from 'state-switch'

export type WechatyEventName =
    'scan'
  | 'login' | 'logout'
  | 'reset' | 'shutdown'
  | 'ding'  | 'dong'
  | 'message'
  | 'heartbeat'
  | 'update'
  | 'error'

export type ServerEventName = 'sys'
                            | 'botie'

export type IoEventName = 'raw' | WechatyEventName | ServerEventName

export interface IoEvent {
  name: IoEventName,
  payload: any,
}

export enum ReadyState {
  CLOSED      = WebSocket.CLOSED,
  CLOSING     = WebSocket.CLOSING,
  CONNECTING  = WebSocket.CONNECTING,
  OPEN        = WebSocket.OPEN,
}

export interface IoServiceSnapshot {
  readyState: ReadyState
  event:     IoEvent
}

export class IoService {
  // https://github.com/ReactiveX/rxjs/blob/master/src/observable/dom/WebSocketSubject.ts
  public event: Subject<IoEvent>

  private _readyState: BehaviorSubject<ReadyState>
  public get readyState() {
    return this._readyState.asObservable()
  }

  public snapshot: IoServiceSnapshot

  private autoReconnect = true
  private log = Brolog.instance()

  private readonly CONNECT_TIMEOUT = 10 * 1000 // 10 seconds
  private readonly ENDPOINT = 'wss://api.chatie.io/v0/websocket/token/'
  private readonly PROTOCOL = 'web|0.0.1'

  private _token: string // FIXME possible be `undefined`
  private _websocket: WebSocket | null
  private moObserver: Observer<IoEvent> // Mobile Originated. moObserver.next() means mobile is sending
  private mtObserver: Observer<IoEvent> // Mobile Terminated. mtObserver.next() means mobile is receiving
  private sendBuffer: string[] = []

  private state: StateSwitch

  constructor() {
    this.log.verbose('IoService', 'constructor()')
  }

  public async init(): Promise<void> {
    this.log.verbose('IoService', 'init()')

    if (this.state) {
      throw new Error('re-init')
    }

    this.snapshot = {
      readyState: ReadyState.CLOSED,
      event:     null,
    }

    this._readyState = new BehaviorSubject<ReadyState>(ReadyState.CLOSED)
    this.state = new StateSwitch('IoService', this.log)
    this.state.setLog(this.log)

    try {
      await this.initStateDealer()
      await this.initRxSocket()
    } catch (e) {
      this.log.silly('IoService', 'init() exception: %s', e.message)
      throw e
    }

    this.readyState.subscribe(s => {
      this.log.silly('IoService', 'init() readyState.subscribe(%s)', ReadyState[s])
      this.snapshot.readyState = s
    })
    // IMPORTANT: subscribe to event and make it HOT!
    this.event.subscribe(s => {
      this.log.silly('IoService', 'init() event.subscribe({name:%s})', s.name)
      this.snapshot.event = s
    })

    return
  }

  public token(): string
  public token(newToken: string): void

  public token(newToken?: string): string | void {
    this.log.silly('IoService', 'token(%s)', newToken)
    if (newToken) {
      this._token = newToken
      return
    }
    return this._token
  }

  async start(): Promise<void> {
    this.log.verbose('IoService', 'start() with token:%s', this._token)

    if (!this._token) {
      throw new Error('start() without token')
    }

    if (this.state.on()) {
      throw new Error('state is already ON')
    }
    if (this.state.pending()) {
      throw new Error('state is pending')
    }

    this.state.on('pending')

    this.autoReconnect = true

    try {
      await this.connectRxSocket()
      this.state.on(true)
    } catch (e) {
      this.log.warn('IoService', 'start() failed:%s', e.message)

      this.state.off(true)
    }
  }

  async stop(): Promise<void> {
    this.log.verbose('IoService', 'stop()')

    if (this.state.off()) {
      this.log.warn('IoService', 'stop() state is already off')
      if (this.state.pending()) {
        throw new Error('state pending() is true')
      }
      return
    }

    this.state.off('pending')

    this.autoReconnect = false

    if (!this._websocket) {
      throw new Error('no websocket')
    }

    await this.socketClose(1000, 'IoService.stop()')
    this.state.off(true)

    return
  }

  public async restart(): Promise<void> {
    this.log.verbose('IoService', 'restart()')
    try {
      await this.stop()
      await this.start()
    } catch (e) {
      this.log.error('IoService', 'restart() error:%s', e.message)
      throw e
    }
    return
  }

  private initStateDealer() {
    this.log.verbose('IoService', 'initStateDealer()')

    const isReadyStateOpen = (s: ReadyState) => s === ReadyState.OPEN

    this.readyState.pipe(
      filter(isReadyStateOpen),
    )
      .subscribe(open => this.stateOnOpen())
  }

  /**
   * Creates a subject from the specified observer and observable.
   *  - https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/subject.md
   * Create an Rx.Subject using Subject.create that allows onNext without subscription
   *   A socket implementation (example, don't use)
   *  - http://stackoverflow.com/a/34862286/1123955
   */
  private async initRxSocket(): Promise<void> {
    this.log.verbose('IoService', 'initRxSocket()')

    if (this.event) {
      throw new Error('re-init is not permitted')
    }

    // 1. Mobile Originated. moObserver.next() means mobile is sending
    this.moObserver = {
      next:     this.socketSend.bind(this),
      error:    this.socketClose.bind(this),
      complete: this.socketClose.bind(this),
    }

    // 2. Mobile Terminated. mtObserver.next() means mobile is receiving
    const observable = new Observable((observer: Observer<IoEvent>) => {
      this.log.verbose('IoService', 'initRxSocket() Observable.create()')
      this.mtObserver = observer

      return this.socketClose.bind(this)
    })

    // 3. Subject for MO & MT Observers
    this.event = Subject.create(this.moObserver, observable.pipe(share()))

  }

  private async connectRxSocket(): Promise<void> {
    this.log.verbose('IoService', 'connectRxSocket()')

    // FIXME: check & close the old one
    if (this._websocket) {
      throw new Error('already has a websocket')
    }

    // if (this.state.target() !== 'open'
    //   || this.state.current() !== 'open'
    //   || this.state.stable()
    if (this.state.off()) {
      throw new Error('switch state is off')
    } else if (!this.state.pending()) {
      throw new Error('switch state is already ON')
    }

    this._websocket = new WebSocket(this.endPoint(), this.PROTOCOL)
    this.socketUpdateState()

    const onOpenPromise = new Promise<void>((resolve, reject) => {
      this.log.verbose('IoService', 'connectRxSocket() Promise()')

      const id = setTimeout(() => {
        this._websocket = null
        const e = new Error('rxSocket connect timeout after '
                            + Math.round(this.CONNECT_TIMEOUT / 1000),
                          )
        reject(e)
      }, this.CONNECT_TIMEOUT) // timeout for connect websocket

      this._websocket.onopen = (e) => {
        this.log.verbose('IoService', 'connectRxSocket() Promise() WebSocket.onOpen() resolve()')
        this.socketUpdateState()
        clearTimeout(id)
        resolve()
      }
    })

    // Handle the payload
    this._websocket.onmessage = this.socketOnMessage.bind(this)
    // Deal the event
    this._websocket.onerror   = this.socketOnError.bind(this)
    this._websocket.onclose   = this.socketOnClose.bind(this)

    return onOpenPromise
  }

  private endPoint(): string {
    const url = this.ENDPOINT + this._token
    this.log.verbose('IoService', 'endPoint() => %s', url)
    return url
  }

  /******************************************************************
   *
   * State Event Listeners
   *
   */
  private stateOnOpen() {
    this.log.verbose('IoService', 'stateOnOpen()')

    this.socketSendBuffer()
    this.rpcUpdate('from stateOnOpen()')
  }

  /******************************************************************
   *
   * Io RPC Methods
   *
   */
  async rpcDing(payload: any): Promise<any> {
    this.log.verbose('IoService', 'ding(%s)', payload)

    const e: IoEvent = {
      name: 'ding',
      payload,
    }
    this.event.next(e)
    // TODO: get the return value
  }

  async rpcUpdate(payload: any): Promise<void> {
    this.event.next({
      name:     'update',
      payload,
    })
  }

  /******************************************************************
   *
   * Socket Actions
   *
   */
  private async socketClose(code?: number, reason?: string): Promise<void> {
    this.log.verbose('IoService', 'socketClose()')

    if (!this._websocket) {
      throw new Error('no websocket')
    }

    this._websocket.close(code, reason)
    this.socketUpdateState()

    const future = new Promise(resolve => {
      this.readyState.pipe(
        filter(s => s === ReadyState.CLOSED),
      )
      .subscribe(resolve)
    })
    await future

    return
  }

  private socketSend(ioEvent: IoEvent) {
    this.log.silly('IoService', 'socketSend({name:%s, payload:%s})', ioEvent.name, ioEvent.payload)

    if (!this._websocket) {
      this.log.silly('IoService', 'socketSend() no _websocket')
    }

    const strEvt = JSON.stringify(ioEvent)
    this.sendBuffer.push(strEvt)

    // XXX can move this to onOpen?
    this.socketSendBuffer()
  }

  private socketSendBuffer(): void {
    this.log.silly('IoService', 'socketSendBuffer() length:%s', this.sendBuffer.length)

    if (!this._websocket) {
      throw new Error('socketSendBuffer(): no _websocket')
    }

    if (this._websocket.readyState !== WebSocket.OPEN) {
      this.log.warn('IoService', 'socketSendBuffer() readyState is not OPEN, send job delayed.')
      return
    }

    while (this.sendBuffer.length) {
      const buf = this.sendBuffer.shift()
      this.log.silly('IoService', 'socketSendBuffer() sending(%s)', buf)
      this._websocket.send(buf)
    }
  }

  private socketUpdateState() {
    this.log.verbose('IoService', 'socketUpdateState() is %s',
      ReadyState[this._websocket?.readyState],
    )

    if (!this._websocket) {
      this.log.error('IoService', 'socketUpdateState() no _websocket')
      return
    }

    this._readyState.next(this._websocket.readyState)
  }

  /******************************************************************
   *
   * Socket Events Listener
   *
   */
  private socketOnMessage(message: MessageEvent) {
    this.log.verbose('IoService', 'onMessage({data: %s})', message.data)

    const data = message.data // WebSocket data

    const ioEvent: IoEvent = {
      name:     'raw',
      payload:  data,
    } // this is default io event for unknown format message

    try {
      const obj = JSON.parse(data)
      ioEvent.name = obj.name
      ioEvent.payload = obj.payload
    } catch (e) {
      this.log.warn('IoService', 'onMessage parse message fail. save as RAW')
    }

    this.mtObserver.next(ioEvent)
  }

  private socketOnError(event: Event) {
    this.log.silly('IoService', 'socketOnError(%s)', event)
    // this._websocket = null
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
   * code: 1006	CLOSE_ABNORMAL
   *  - Reserved. Used to indicate that a connection was closed abnormally
   *    (that is, with no close frame being sent) when a status code is expected.
   */
  private socketOnClose(closeEvent: CloseEvent) {
    this.log.verbose('IoService', 'socketOnClose({code:%s, reason:%s, returnValue:%s})',
                                  closeEvent.code,
                                  closeEvent.reason,
                                  closeEvent.returnValue,
                    )
    this.socketUpdateState()
    /**
     * reconnect inside onClose
     */
    if (this.autoReconnect) {
      this.state.on('pending')
      setTimeout(async () => {
        try {
          await this.connectRxSocket()
          this.state.on(true)
        } catch (e) {
          this.log.warn('IoService', 'socketOnClose() autoReconnect() exception: %s', e)
          this.state.off(true)
        }
      }, 1000)
    } else {
      this.state.off(true)
    }
    this._websocket = null

    if (!closeEvent.wasClean) {
      this.log.warn('IoService', 'socketOnClose() event.wasClean FALSE')
      // TODO emit error
    }
  }
}
