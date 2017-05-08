import { version }      from '../../package.json'

import {
  BehaviorSubject,
  Observable,
  Observer,
  Subject,
}                       from 'rxjs/Rx'

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

export type ServerEventName =
  'sys'

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
  socket:     IoEvent
}

export class IoService {
  public readonly version = version
  // https://github.com/ReactiveX/rxjs/blob/master/src/observable/dom/WebSocketSubject.ts
  public socket: Subject<IoEvent>

  public get readyState() {
    return this._readyState.asObservable()
  }
  private _readyState: BehaviorSubject<ReadyState>

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

  private stateSwitch: StateSwitch<'open', 'close'>

  constructor() {
    this.log.verbose('IoService', 'constructor() v%s', this.version)
  }

  public async init(): Promise<void> {
    this.log.verbose('IoService', 'init()')

    if (this.stateSwitch) {
      throw new Error('re-init')
    }

    this._readyState = new BehaviorSubject<ReadyState>(ReadyState.CLOSED)
    this.stateSwitch = new StateSwitch<'open', 'close'>('IoService', 'close', this.log)
    this.stateSwitch.setLog(this.log)

    try {
      await this.initStateDealer()
      await this.initRxSocket()
    } catch (e) {
      this.log.silly('IoService', 'init() exception: %s', e.message)
      throw e
    }

    this.snapshot = {
      readyState: ReadyState.CLOSED,
      socket:     null,
    }
    this.readyState.subscribe(s => {
      this.log.silly('IoService', 'init() readyState.subscribe(%s)', ReadyState[s])
      this.snapshot.readyState = s
    })
    this.socket.subscribe(e => {
      this.log.silly('IoService', 'init() socket.subscribe(%s)', e)
      this.snapshot.socket = e
    })

    return
  }

  public token(newToken?: string): string {
    this.log.silly('IoService', 'token(%s)', newToken)
    if (newToken) {
      this._token = newToken
    }
    return this._token
  }

  async start(): Promise<void> {
    this.log.verbose('IoService', 'start() with token:%s', this._token)

    if (!this._token) {
      throw new Error('start() without token')
    }

    if (this.stateSwitch.target() === 'open') {
      throw new Error('stateSwitch target is already `open`')
    }
    if (this.stateSwitch.inprocess()) {
      throw new Error('stateSwitch inprocess() is true')
    }

    this.stateSwitch.target('open')
    this.stateSwitch.current('open', false)

    this.autoReconnect = true

    try {
      await this.connectRxSocket()
      this.stateSwitch.current('open', true)
    } catch (e) {
      this.log.warn('IoService', 'start() failed:%s', e.message)

      this.stateSwitch.target('close')
      this.stateSwitch.current('close', true)
    }
  }

  async stop(): Promise<void> {
    this.log.verbose('IoService', 'stop()')

    if (this.stateSwitch.target() === 'close') {
      this.log.warn('IoService', 'stop() stateSwitch target is already `close`')
      if (this.stateSwitch.inprocess()) {
        throw new Error('stateSwitch inprocess() is true')
      }
      return
    }

    this.stateSwitch.target('close')
    this.stateSwitch.current('close', false)

    this.autoReconnect = false

    if (!this._websocket) {
      throw new Error('no websocket')
    }

    await this.socketClose(1000, 'IoService.stop()')
    this.stateSwitch.current('close', true)

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
    this.readyState.filter(s => s === ReadyState.OPEN)
                  .subscribe(open => this.statusOnOpen())
  }

  /**
   * Creates a subject from the specified observer and observable.
   *  - https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/subject.md
   * Create an Rx.Subject using Subject.create that allows onNext without subscription
   *   A socket implementation (example, don't use)
   *  - http://stackoverflow.com/a/34862286/1123955
   */
  private initRxSocket(): void {
    this.log.verbose('IoService', 'initRxSocket()')

    if (this.socket) {
      throw new Error('re-init is not permitted')
    }

    // 1. Mobile Originated. moObserver.next() means mobile is sending
    this.moObserver = {
      next:     this.socketSend.bind(this),
      error:    this.socketClose.bind(this),
      complete: this.socketClose.bind(this),
    }

    // 2. Mobile Terminated. mtObserver.next() means mobile is receiving
    const observable = Observable.create((observer: Observer<IoEvent>) => {
      this.log.verbose('IoService', 'initRxSocket() Observable.create()')
      this.mtObserver = observer
      return this.socketClose.bind(this)
    })

    // 3. Subject for MO & MT Observers
    this.socket = Subject.create(this.moObserver, observable)

    return
  }

  private async connectRxSocket(): Promise<void> {
    this.log.verbose('IoService', 'connectRxSocket()')

    // FIXME: check & close the old one
    if (this._websocket) {
      throw new Error('already has a websocket')
    }

    if (this.stateSwitch.target() !== 'open'
      || this.stateSwitch.current() !== 'open'
      || this.stateSwitch.stable()
    ) {
      throw new Error('switch state not right')
    }

    this._websocket = new WebSocket(this.endPoint(), this.PROTOCOL)
    this.socketUpdateState()

    const onOpenPromise = new Promise<void>((resolve, reject) => {
      this.log.verbose('IoService', 'connectRxSocket() Promise()')

      const id = setTimeout(() => {
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
   * Status Event Listeners
   *
   */
  private statusOnOpen() {
    this.log.verbose('IoService', 'statusOnOpen()')

    this.socketSendBuffer()

    const ioEvent: IoEvent = {
      name: 'update',
      payload: 'onOpen',
    }
    this.socket.next(ioEvent)
  }

  /******************************************************************
   * Io RPC Methods
   *
   */
  async ding(payload: any): Promise<any> {
    this.log.verbose('IoService', 'ding(%s)', payload)

    const e: IoEvent = {
      name: 'ding',
      payload,
    }
    this.socket.next(e)
    // TODO: get the return value
  }

  /******************************************************************
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
      this.readyState.filter(s => s === ReadyState.CLOSED)
                      .subscribe(resolve)
    })
    await future

    this._websocket = null
    return
  }

  private socketSend(ioEvent: IoEvent) {
    this.log.silly('IoService', 'socketSend({name:%s, payload:%s})', ioEvent.name, ioEvent.payload)

    if (!this._websocket) {
      this.log.silly('IoService', 'socketSend() no _websocket')
    }

    if (ioEvent) {
      this.log.silly('IoService', 'socketSend() buf len: %d', this.sendBuffer.length)
      const strEvt = JSON.stringify(ioEvent)
      this.sendBuffer.push(strEvt)
    }

    // XXX can move this to onOpen?
    if (this.snapshot.readyState === ReadyState.OPEN) {
      this.socketSendBuffer()
    }
  }

  private socketSendBuffer() {
    this.log.silly('IoService', 'socketSendBuffer() length:%s', this.sendBuffer.length)

    if (!this._websocket) {
      throw new Error('socketSendBuffer(): no _websocket')
    }

    while (this.sendBuffer.length) {
      this.log.silly('IoService', 'socketSendBuffer() length: %d', this.sendBuffer.length)

      const buf = this.sendBuffer.shift()
      this._websocket.send(buf)
    }
  }

  private socketUpdateState() {
    this.log.verbose('IoService', 'socketUpdateState() is %s',
                                  ReadyState[this._websocket.readyState],
                    )
    this._readyState.next(this._websocket.readyState)
  }

  /******************************************************************
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
      this.stateSwitch.current('open', false)
      setTimeout(async () => {
        await this.connectRxSocket()
        this.stateSwitch.current('open', true)
      }, 1000)
    } else {
      this.stateSwitch.target('close')
      this.stateSwitch.current('close', true)
    }
    this._websocket = null

    if (!closeEvent.wasClean) {
      this.log.warn('IoService', 'socketOnClose() event.wasClean FALSE')
      // TODO emit error
    }
  }
}
