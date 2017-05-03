// Io Service should be instanciated each time. (one io service for one wechaty component)
// import { Injectable } from '@angular/core';
// @Injectable()

import {
  Injector
}                         from '@angular/core'

import {
  Observable,
  Subscriber,
  Subject,
}                         from 'rxjs/Rx'

import { Brolog }         from 'brolog'

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
  private ENDPOINT = 'wss://api.wechaty.io/v0/websocket/token/'
  private PROTOCOL = 'web|0.0.1'

  public websocket: WebSocket | null
  public subscriber: Subscriber<IoEvent>
  public ioSubject: Subject<IoEvent>
  private sendBuffer: string[] = []

  public log = Brolog.instance()
  private token: string

  public autoReconnect = true

  constructor(
    private injector: Injector,
   ) {
    this.log.verbose('IoService', 'constructor()')
    // console.log(injector)
  }

  public setToken(token: string) {
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
    this.log.verbose('IoService', 'stop()')

    this.autoReconnect = false

    if (this.websocket) {
      this.websocket.close(1000, 'IoService.stop()')
    }
    if (this.ioSubject) {
      this.ioSubject.unsubscribe()
    }
    return Promise.resolve(this)
  }

  restart(): Promise<IoService> {
    this.log.silly('IoService', 'restart()')
    return this.stop().then(_ => this.start())
  }

  initIoSubject() {
    this.log.verbose('IoService', 'initIoSubject()')

    return new Promise(resolve => {
      const observable = Observable.create((subscriber: any) => {
        this.log.verbose('IoService', 'initIoSubject() Observable.create()')
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

  public initWebSocket() {
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

  online(): boolean {
    if (this.websocket && (this.websocket.readyState === WebSocket.OPEN)) {
      return true
    }
    return false
  }
  connecting(): boolean {
    if (this.websocket && (this.websocket.readyState === WebSocket.CONNECTING)) {
      return true
    }
    return false
  }

  io() {
    return this.ioSubject
  }

  private endPoint(): string {
    const END_POINT = 'wss://api.chatie.io/websocket/token/'

    const url = END_POINT + this.token
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
    this.log.silly('IoService', 'wsSend(%s)', e.name)

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
  this.log.verbose('IoService', 'onOpen()')

  this.log.verbose('IoService', 'onOpen() require update from io')
  const ioEvent: IoEvent = {
    name: 'update'
    , payload: 'onOpen'
  }
  this.ioSubject.next(ioEvent)
}

/**
 * reconnect inside onClose
 */
function onClose(this: IoService, e: any) {
  this.log.verbose('IoService', 'onClose(%s)', e)

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

function onError(this: IoService, e: any) {
  this.log.silly('IoService', 'onError(%s)', e)
  this.websocket = null
}

/**
 *
 * this: Subscriber
 *
 */
function onMessage(this: IoService, message: any) {
  const data = message.data // WebSocket data
  this.log.verbose('IoService', 'onMessage(%s)', data)

  const ioEvent: IoEvent = {
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
