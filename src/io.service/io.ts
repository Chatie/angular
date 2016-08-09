import {
  Injector
} from '@angular/core'

import {
  Observable
  , Subscriber
  , Subject
} from 'rxjs/Rx'

import { Brolog } from 'brolog'

export type WechatyEventName = 
  'heartbeat'
  | 'login' | 'logout'
  | 'reset' | 'shutdown'
  | 'ding'  | 'dong'
  | 'scan'  | 'message'
  | 'update'
  | 'error'

export type ServerEventName = 
  'sys'

export type IoEventName = 'raw' | WechatyEventName | ServerEventName

/**
 * Io Event Interface
 */
export interface IoEvent { 
  name: IoEventName
  payload: any
}

export class IoService {
  private ENDPOINT = 'wss://api.wechaty.io/v0/websocket/token/'
  private PROTOCOL = 'web|0.0.1'
  private token: string

  private websocket: WebSocket
  private subscriber: Subscriber<IoEvent>
  private ioSubject: Subject<IoEvent>
  private sendBuffer: string[] = []

  private log = this.injector.get(Brolog)

  private autoReconnect = true

  constructor(
    private injector: Injector
   ) {
    this.log.silly('IoService', 'constructor()')
  }

  io() {
    return this.ioSubject
  }

  setToken(token: string) {
    this.log.silly('IoService', 'setToken(%s)', token)
    this.token = token
  }

  start(): Promise<IoService> {
    this.log.silly('IoService', 'start() with token:[%s]', this.token)

    if (!this.token){
      this.log.warn('IoService', 'start() without valid token:[%s]', this.token)
    }
    this.autoReconnect = true

    return this.initIoSubject()
    .then(_ => this.initWebSocket())
    .then(_ => this)
    .catch(e => {
      this.log.silly('IoService', 'start() exception: %s', e.message)
      throw e
    })
  }

  stop(): Promise<IoService> {
    this.log.silly('IoService', 'stop()')

    this.autoReconnect = false

    this.websocket && this.websocket.close(1000, 'IoService.stop()')
    this.ioSubject && this.ioSubject.unsubscribe()

    return Promise.resolve(this)
  }

  restart(): Promise<IoService> {
    this.log.silly('IoService', 'restart()')
    return this.stop().then(_ => this.start())
  }

  ding(payload) {
    this.log.silly('IoService', 'ding(%s)', payload)

    const e: IoEvent = {
      name: 'ding'
      , payload
    }
    this.io().next(e)
  }

  online(): boolean {
    return this.websocket && (this.websocket.readyState === WebSocket.OPEN)
  }
  connecting(): boolean {
    return this.websocket && (this.websocket.readyState === WebSocket.CONNECTING)
  }

  private initIoSubject() {
    this.log.silly('IoService', 'initIoSubject()')

    return new Promise(resolve => {
      const observable = Observable.create(subscriber => {
        this.log.silly('IoService', 'initIoSubject() Observable.create()')
        this.subscriber = subscriber

        ////////////////////////
        resolve()
        ////////////////////////

        return this.wsClose.bind(this)
      }).share()

      const obs = {
        complete: this.wsClose.bind(this)
        , next: this.wsSend.bind(this)
      }

      this.ioSubject = Subject.create(obs, observable)
    })
  }

  private initWebSocket() {
    this.log.silly('IoService', 'initWebSocket() with token:[%s]', this.token)

    if (this.online()) {
      this.log.warn('IoService', 'initWebSocket() there already has a live websocket. will go ahead and overwrite it')
    }

    this.websocket = new WebSocket(this.endPoint(), this.PROTOCOL)

    this.websocket.onerror = onError.bind(this)
    this.websocket.onopen  = onOpen.bind(this)
    this.websocket.onclose = onClose.bind(this)

    // Handle the payload
    this.websocket.onmessage = onMessage.bind(this)
  }

  private endPoint(): string {
    return this.ENDPOINT + this.token
  }

  private wsClose() {
    this.log.silly('IoService', 'wsClose()')

    this.websocket.close()
    // this.websocket = null
  }

  private wsSend(e: IoEvent) {
    this.log.silly('IoService', 'wsSend(%s)', e.name)

    const message = JSON.stringify(e)

    if (this.online()) {
      // 1. check buffer for send old ones
      while (this.sendBuffer.length) {
        this.log.silly('IoService', 'wsSend() buffer processing: length: %d', this.sendBuffer.length)

        let m = this.sendBuffer.shift()
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

function onOpen(e) {
  this.log.silly('IoService', 'onOpen()')

  this.log.silly('IoService', 'onOpen() require update from io')
  const ioEvent: IoEvent = {
    name: 'update'
    , payload: 'onOpen'
  }
  this.ioSubject.next(ioEvent)
}

/**
 * reconnect inside onClose
 */
function onClose(e) {
  this.log.silly('IoService', 'onClose(%s)', e)

  // this.websocket = null
  if (this.autoReconnect) {
    setTimeout(_ => {
      this.initWebSocket()
    }, 1000)
  }
  
  if (!e.wasClean) {
    // console.warn('IoService.onClose: e.wasClean FALSE')
  }
}

function onError(e) {
  this.log.silly('IoService', 'onError(%s)', e)
  this.websocket = null
}

/**
 *
 * this: Subscriber
 *
 */
function onMessage(message)
{
  const data = message.data // WebSocket data
  this.log.silly('IoService', 'onMessage(%s)', data)

  let ioEvent: IoEvent = {
    name: 'raw'
    , payload: data
  } // this is default io event for unknown format message

  try {
    const obj = JSON.parse(data)
    ioEvent.name = obj.name
    ioEvent.payload = obj.payload
  } catch (e) {
    this.log.warn('IoService', 'onMessage parse message fail.')
  }

  this.subscriber.next(ioEvent)
}
