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

export class IoService {
  public ioSubject: Subject<IoEvent>
  public version: string

  public autoReconnect = true
  public log = Brolog.instance()
  public websocket: WebSocket | null

  private ENDPOINT = 'wss://api.chatie.io/v0/websocket/token/'
  private PROTOCOL = 'web|0.0.1'

  private sendBuffer: string[] = []

  private _token: string // FIXME possible be `undefined`


  constructor() {
    this.log.verbose('IoService', 'constructor() v%s', this.version)
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

    try {
      await this.initRxSocket()
    } catch (e) {
      this.log.silly('IoService', 'start() exception: %s', e.message)
      throw e
    }
  }

  async stop(): Promise<void> {
    this.log.verbose('IoService', 'stop()')

    this.autoReconnect = false

    if (this.websocket) {
      this.websocket.close(1000, 'IoService.stop()')
    }
    if (this.ioSubject) {
      this.ioSubject.unsubscribe()
    }

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

  /**
   * Creates a subject from the specified observer and observable.
   *  - https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/subject.md
   * Create an Rx.Subject using Subject.create that allows onNext without subscription
   *   A socket implementation (example, don't use)
   *  - http://stackoverflow.com/a/34862286/1123955
   */
  async initRxSocket(): Promise<void> {
    this.log.verbose('IoService', 'initRxSocket()')

    if (this.online()) {
      this.log.warn('IoService', 'initRxSocket() there already has a live websocket. will go ahead and overwrite it')
    }

    this.websocket = new WebSocket(this.endPoint(), this.PROTOCOL)

    // Create observer to handle sending messages
    const observer: Observer<IoEvent> = {
      next:     this.wsSend.bind(this),
      error:    this.wsClose.bind(this),
      complete: this.wsClose.bind(this),
    }

    // Create observable to handle the messages
    const observable = Observable.create(obs => {
xx
        // Handle the payload
        this.websocket.onmessage = (message: MessageEvent) => {
          const data = message.data // WebSocket data
          this.log.verbose('IoService', 'onMessage(%s)', data)

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

          obs.next(ioEvent)
        }

        this.websocket.onerror = (e) => {
          this.log.silly('IoService', 'onError(%s)', e)
          this.websocket = null
        }

        this.websocket.onclose = (e) => {
          /**
           * reconnect inside onClose
           */
          this.log.verbose('IoService', 'onClose(%s)', e)

          // this.websocket = null
          if (this.autoReconnect) {
            setTimeout(_ => {
              this.initRxSocket()
            }, 1000)
          }

          // if (!e.wasClean) {
          //   // console.warn('IoService.onClose: e.wasClean FALSE')
          // }
        }

        return () => {
            this.websocket.close()
        }
    })

    this.ioSubject = Subject.create(observer, observable)

    return new Promise<void>((resolve, reject) => {
      const id = setTimeout(() => {
        reject(new Error('rxSocket connect timeout'))
      }, 10 * 1000)

      this.websocket.onopen = (e) => {
        this.log.verbose('IoService', 'onOpen()')

        this.log.verbose('IoService', 'onOpen() require update from io')
        const ioEvent: IoEvent = {
          name: 'update'
          , payload: 'onOpen'
        }
        this.ioSubject.next(ioEvent)
        clearTimeout(id)
        resolve()
      }
    })

  }

  // public initWebSocket(): void {
  //   this.log.silly('IoService', 'initWebSocket() with token:[%s]', this._token)

  //   if (this.online()) {
  //     this.log.warn('IoService', 'initWebSocket() there already has a live websocket. will go ahead and overwrite it')
  //   }

  //   this.websocket = new WebSocket(this.endPoint(), this.PROTOCOL)

  //   this.websocket.onerror = onError.bind(this)
  //   this.websocket.onopen  = onOpen.bind(this)
  //   this.websocket.onclose = onClose.bind(this)

  //   // Handle the payload
  //   this.websocket.onmessage = onMessage.bind(this)
  // }

  online(): boolean {
    if (!this.websocket) {
      return false
    }
    return this.websocket.readyState === WebSocket.OPEN
  }
  connecting(): boolean {
    if (!this.websocket) {
      return false
    }
    return this.websocket.readyState === WebSocket.CONNECTING
  }

  io() {
    return this.ioSubject
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
    this.io().next(e)
  }

  wsClose() {
    this.log.verbose('IoService', 'wsClose()')

    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
  }

  private wsSend(e: IoEvent) {
    this.log.silly('IoService', 'wsSend({name:%s, payload:%s})', e.name, e.payload)

    const message = JSON.stringify(e)

    if (this.online()) {
      if (!this.websocket) {
        throw new Error('no websocket')
      }
      // 1. check buffer for send old ones
      while (this.sendBuffer.length) {
        this.log.silly('IoService', 'wsSend() buffer processing: length: %d', this.sendBuffer.length)

        const m = this.sendBuffer.shift()
        this.websocket.send(m)
      }
      // 2. send this one
      this.websocket.send(message)

    } else { // 3. buffer this message for future retry
      this.sendBuffer.push(message)
      this.log.silly('IoService', 'wsSend() without WebSocket.OPEN, buf len: %d', this.sendBuffer.length)
    }
  }
}

function onOpen(this: IoService, e: any) {
}
