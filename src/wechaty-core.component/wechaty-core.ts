import {
  Component
  , Inject
  , OnInit
  , OnDestroy
  , EventEmitter
  , Input
  , Output
  , NgZone
  , Injector
} from '@angular/core'

import {
  Observable
  , Subject
  , Subscription
} from 'rxjs/Rx'

import { Brolog } from 'brolog'

import { IoService, IoEvent } from '../io.service/index'

/**
 * Payload Interfaces
 */
export interface ScanInfo {
  url: string
  code: number
}

export interface UserInfo {
  uin: number
  name: string
  remark: string
  sex: number
  signature: string
}

@Component({
  moduleId: module.id
  , selector: 'wechaty-core'
  , templateUrl: 'wechaty-core.html'
  , styleUrls: ['wechaty-core.css']
})

export class WechatyCoreCmp implements OnInit, OnDestroy {
  @Output() heartbeat = new EventEmitter<any>()
  @Output() scan      = new EventEmitter<ScanInfo>()
  @Output() login     = new EventEmitter<UserInfo>()
  @Output() message   = new EventEmitter<string>()
  @Output() logout    = new EventEmitter<UserInfo>()
  @Output() error     = new EventEmitter<any>()

  private _token: string
  @Input()
  set token(token: string) {
    this.log.verbose('WechatyCoreCmp', 'set token(%s)', token)
    if (token && this._token !== token) {
      this.log.verbose('WechatyCoreCmp', 'new token found')
      this._token = token.trim()
      if (this.ioService) { // There's no IoService when instanciate this component
        this.log.verbose('WechatyCoreCmp', 'ioService set new token') 
        this.ioService.setToken(this._token)
        this.ioService.restart()
      }
    }
  }
  get token() { return this._token }

  private ioSubscription: Subscription
  private ioService: IoService

  private npmVersion: string = 'TODO: support version'

  counter = 0
  
  constructor(
    private ngZone: NgZone
    , private log: Brolog
    , private injector: Injector
  ) {
    this.log.verbose('WechatyCoreCmp', 'constructor()')
    // TBD: how to do import version from json file in browser with typescript? 
    // this.npmVersion = require('../package.json').version

    this.ioService = new IoService(injector)
  }

  ngOnInit() {
    this.log.verbose('WechatyCoreCmp', 'ngOninit() with token: ' + this.token)

    /**
     * @Input(token) is not inittialized in constructor()
     */
    this.ioService.setToken(this.token)
    this.ioService.start()

    this.ioSubscription = this.ioService.io()
                          .subscribe(this.onIo.bind(this))
  }

  ngOnDestroy() {
    this.log.verbose('WechatyCoreCmp', 'ngOnDestroy()')

    if (this.ioSubscription) {
      this.ioSubscription.unsubscribe()
      this.ioSubscription = null
    }
    
    this.ioService.stop()
    this.ioService = null
  }

  private onIo(e: IoEvent) {
    this.log.silly('WechatyCoreCmp', 'onIo#%d(%s)', this.counter++, e.name)

    switch(e.name) {
      case 'scan':
        this.scan.emit(e.payload as ScanInfo)
        break
      case 'login':
        this.login.emit(e.payload as UserInfo)
        break
      case 'message':
        this.message.emit(e.payload)
        break
      case 'logout':
        this.logout.emit(e.payload as UserInfo)
        break
      case 'error':
        this.error.emit(e.payload)
        break

      case 'ding':
      case 'dong':
      case 'raw':
        this.heartbeat.emit(e.name + '[' + e.payload + ']')
        break
      case 'heartbeat':
        this.heartbeat.emit(e.payload)
        break

      case 'sys':
        this.log.silly('WechatyCoreCmp', 'onIo(%s): %s', e.name, e.payload)
        break

      default:
        this.log.warn('WechatyCoreCmp', 'onIo() unknown event name: %s[%s]', e.name, e.payload)
        break
    }
  }

  reset(reason?: string) {
    this.log.verbose('WechatyCoreCmp', 'reset(%s)', reason)

    const resetEvent: IoEvent = {
      name: 'reset'
      , payload: reason
    }
    this.ioService.io()
        .next(resetEvent)
  }

  shutdown(reason?: string) {
    this.log.verbose('WechatyCoreCmp', 'shutdown(%s)', reason)

    const shutdownEvent: IoEvent = {
      name: 'shutdown'
      , payload: reason
    }
    this.ioService.io()
        .next(shutdownEvent)
  }

  logoff(reason?: string) { // use the name `logoff` here to prevent conflict with @Output(logout) 
    this.log.verbose('WechatyCoreCmp', 'logoff(%s)', reason)

    const quitEvent: IoEvent = {
      name: 'logout'
      , payload: reason
    }
    this.ioService.io()
        .next(quitEvent)
  }

  online(): boolean {
    return this.ioService.online()
  }

  connecting(): boolean {
    return this.ioService.connecting()
  }

  offline(): boolean {
    return !(this.online() || this.connecting())
  }

  version() { return this.npmVersion}

}
