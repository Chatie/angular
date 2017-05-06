import { version } from '../../package.json'

import {
  Observable,
  Observer,
  Subject,
}                  from 'rxjs/Rx'

import { Brolog }  from 'brolog'

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
  name: IoEventName
  payload: any
}

export enum Status {
  CLOSE,
  OPEN,
  ERROR,
}

export class IoService {
  public readonly version = version
  public socket: Subject<IoEvent>

  public get status() {
    return this._status.asObservable()
  }
  private _status = new Subject<Status>()

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

  constructor() {
    this.log.verbose('IoService', 'constructor() v%s', this.version)
  }

  public async init(): Promise<void> {
    this.log.verbose('IoService', 'init()')

    try {
      await this.initProtocol()
      await this.initRxSocket()
    } catch (e) {
      this.log.silly('IoService', 'init() exception: %s', e.message)
      throw e
    }

    return
  }

  public token(newToken?: string): string {
    this.log.silly('IoService', 'setToken(%s)', newToken)
    if (newToken) {
      this._token = newToken
    }
    return this._token
  }

  async start(): Promise<void> {
    this.log.silly('IoService', 'start() with token:[%s]', this._token)

    if (!this._token) {
      this.log.warn('IoService', 'start() without valid token:[%s]', this._token)
    }
    this.autoReconnect = true

    return await this.connectRxSocket()
  }

  async stop(): Promise<void> {
    this.log.verbose('IoService', 'stop()')

    this.autoReconnect = false

    if (this._websocket) {
      this.socketClose(1000, 'IoService.stop()')
    }

    // if (this.socket) {
    //   this.socket.unsubscribe()
    // }

    return
  }

  public async restart(): Promise<void> {
    this.log.silly('IoService', 'restart()')
    try {
      await this.stop()
      await this.start()
    } catch (e) {
      this.log.error('IoService', 'restart() error:%s', e.message)
      throw e
    }
    return
  }

  private initProtocol() {
    this.status.subscribe(s => {
      switch (s) {
        case Status.OPEN:
          this.statusOnOpen()
          break

      default:
        this.log.warn('IoService', 'initProtocol() unknown status:%s', s)
      }
    })
  }

  /**
   * Status Event Listeners
   *
   */
  private statusOnOpen() {
    this.log.verbose('IoService', 'statusOnOpen()')
    const ioEvent: IoEvent = {
      name: 'update'
      , payload: 'onOpen'
    }
    this.socket.next(ioEvent)
  }

  /**
   * Creates a subject from the specified observer and observable.
   *  - https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/subject.md
   * Create an Rx.Subject using Subject.create that allows onNext without subscription
   *   A socket implementation (example, don't use)
   *  - http://stackoverflow.com/a/34862286/1123955
   */
  initRxSocket(): void {
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
    const observable = Observable.create(observer => {
        this.mtObserver = observer
        return this.socketClose.bind(this)
    })

    // 3. Subject for MO & MT Observers
    this.socket = Subject.create(this.moObserver, observable)

    return
  }

  private async connectRxSocket(): Promise<void> {
    this.log.verbose('IoService', 'connectRxSocket()')

    if (this.online()) {
      this.log.warn('IoService', 'connectRxSocket() there already has a live websocket. will go ahead and overwrite it')
    }

    // FIXME: check & close the old one
    if (this._websocket) {
      this.log.warn('IoService', 'connectRxSocket() closing old unclosed websocket...')
      this.socketClose(1000, 'IoService.connectRxSocket()')
    }

    this._websocket = new WebSocket(this.endPoint(), this.PROTOCOL)

    // Handle the payload
    this._websocket.onmessage = this.socketOnMessage.bind(this)
    // Deal the event
    this._websocket.onerror   = this.socketOnError.bind(this)
    this._websocket.onclose   = this.socketOnClose.bind(this)

    const onOpenPromise = new Promise<void>((resolve, reject) => {
      this.log.verbose('IoService', 'connectRxSocket() Promise() onOpenPromise')

      const id = setTimeout(() => {
        const e = new Error('rxSocket connect timeout after '
                            + Math.round(this.CONNECT_TIMEOUT / 1000)
                          )
        reject(e)
      }, this.CONNECT_TIMEOUT) // timeout for connect websocket

      this._websocket.onopen = (e) => {
        this.log.verbose('IoService', 'connectRxSocket() Promise() WebSocket.onOpen()')
        this._status.next(Status.OPEN)
        clearTimeout(id)
        resolve()
      }
    })
  }

  online(): boolean {
    if (!this._websocket) {
      return false
    }
    return this._websocket.readyState === WebSocket.OPEN
  }
  connecting(): boolean {
    if (!this._websocket) {
      return false
    }
    return this._websocket.readyState === WebSocket.CONNECTING
  }

  private endPoint(): string {
    const url = this.ENDPOINT + this._token
    this.log.verbose('IoService', 'endPoint() => %s', url)
    return url
  }

  ding(payload: any) {
    this.log.verbose('IoService', 'ding(%s)', payload)

    const e: IoEvent = {
      name: 'ding'
      , payload
    }
    this.socket.next(e)
  }

  /**
   * Socket Actions
   *
   */
  private socketClose(code?: number, reason?: string) {
    this.log.verbose('IoService', 'socketClose()')

    if (!this._websocket) {
      throw new Error('no websocket')
    }
    const ret = this._websocket.close(code, reason)
    this._websocket = null
    return ret
  }

  private socketSend(e: IoEvent) {
    this.log.silly('IoService', 'socketSend({name:%s, payload:%s})', e.name, e.payload)

    const message = JSON.stringify(e)

    if (this.online()) {
      if (!this._websocket) {
        throw new Error('no websocket')
      }
      // 1. check buffer for send old ones
      while (this.sendBuffer.length) {
        this.log.silly('IoService', 'wsSend() buffer processing: length: %d', this.sendBuffer.length)

        const m = this.sendBuffer.shift()
        this._websocket.send(m)
      }
      // 2. send this one
      this._websocket.send(message)

    } else { // 3. buffer this message for future retry
      this.sendBuffer.push(message)
      this.log.silly('IoService', 'wsSend() without WebSocket.OPEN, buf len: %d', this.sendBuffer.length)
    }
  }

  /**
   * Socket Events Listener
   *
   */
  private socketOnMessage(message: MessageEvent) {
    this.log.verbose('IoService', 'onMessage({data: %s})', message.data)
    const data = message.data // WebSocket data

    const ioEvent: IoEvent = {
      name: 'raw',
      payload: data,
    } // this is default io event for unknown format message

    try {
      const obj = JSON.parse(data)
      ioEvent.name = obj.name
      ioEvent.payload = obj.payload
    } catch (e) {
      this.log.warn('IoService', 'onMessage parse message fail.')
    }

    this.mtObserver.next(ioEvent)
  }

  private socketOnError(event: Event) {
    this.log.silly('IoService', 'socketOnError(%s)', event)
    this._websocket = null
  }

  private socketOnClose(event: Event) {
    this.log.verbose('IoService', 'socketOnClose(%s)', event)

    /**
     * reconnect inside onClose
     */
    if (this.autoReconnect) {
      setTimeout(_ => {
        this.initRxSocket()
      }, 1000)
    }
    // this.websocket = null

    // if (!e.wasClean) {
    //   // console.warn('IoService.onClose: e.wasClean FALSE')
    // }
  }
}
