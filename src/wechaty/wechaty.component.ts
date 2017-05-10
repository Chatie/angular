import { version } from '../../package.json'

import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  Output,
  OnDestroy,
  OnInit,
}                   from '@angular/core'

import {
  Observable,
  Subject,
  Subscription,
}                   from 'rxjs/Rx'

import { Brolog }   from 'brolog'

import {
  IoEvent,
  IoService,
  // tslint:disable-next-line:no-unused-variable
  ReadyState,
}                   from './io'

/**
 * for payload
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
  // tslint:disable-next-line:component-selector
  selector: 'wechaty',
  /**
   * http://localhost:4200/app.component.html 404 (Not Found)
   * zone.js:344 Unhandled Promise rejection: Failed to load app.component.html
   * https://github.com/angular/angular-cli/issues/2592#issuecomment-266635266
   * https://github.com/angular/angular-cli/issues/2293
   *
   * console.log from angular:
   *   If you're using Webpack you should inline the template and the styles,
   *   see https://goo.gl/X2J8zc.
   */
  template: '<ng-content></ng-content>',
  // styleUrls: ['./wechaty.component.css'],
  // templateUrl: 'wechaty.component.html',
  // moduleId: module.id,
})
export class WechatyComponent implements OnInit, OnDestroy {
  @Output() message   = new EventEmitter<string>()
  @Output() scan      = new EventEmitter<ScanInfo>()
  @Output() login     = new EventEmitter<UserInfo>()
  @Output() logout    = new EventEmitter<UserInfo>()
  @Output() error     = new EventEmitter<Error>()
  @Output() heartbeat = new EventEmitter<any>()

  private _token: string
  get token() { return this._token }
  @Input() set token(_newToken: string) {
    this.log.verbose('WechatyComponent', 'set token(%s)', _newToken)

    const newToken = (_newToken || '').trim()

    if (this._token === newToken) {
      this.log.silly('WechatyComponent', 'set token(%s) not new', newToken)
      return
    }

    this._token = newToken

    if (!this.ioService) {
      this.log.silly('WechatyComponent', 'set token() skip token init value')
      this.log.silly('WechatyComponent', 'set token() because ioService will do it inside ngOnInit()')
      return
    }

    this.log.silly('WechatyComponent', 'set token(%s) reloading ioService now...', newToken)
    this.ioService.token(this.token)
    this.ioService.restart() // async
  }

  private timer: Observable<any>
  private timerSub: Subscription | null = null
  private ender: Subject<any>

  private ioService: IoService

  public version = version

  counter = 0
  timestamp = new Date()

  constructor(
    private log:    Brolog,
    private ngZone: NgZone,
  ) {
    this.log.verbose('WechatyComponent', 'constructor() v%s', this.version)
  }

  async ngOnInit() {
    this.log.verbose('WechatyComponent', 'ngOninit() with token: ' + this.token)

    this.ioService = new IoService()
    await this.ioService.init()

    this.ioService.event.subscribe(this.onIo.bind(this))
    this.log.silly('WechatyComponent', 'ngOninit() ioService.event.subscribe()-ed')

    /**
     * @Input(token) is not inittialized in constructor()
     */
    if (this.token) {
      this.ioService.token(this.token)
      await this.ioService.start()
    }

    // this.startTimer()
  }

  ngOnDestroy() {
    this.log.verbose('WechatyComponent', 'ngOnDestroy()')

    this.endTimer()

    if (this.ioService) {
      this.ioService.stop()
      // this.ioService = null
    }
  }

  onIo(e: IoEvent) {
    this.log.silly('WechatyComponent', 'onIo#%d(%s)', this.counter++, e.name)
    this.timestamp = new Date()

    switch (e.name) {
      case 'scan':
        this.scan.emit(e.payload as ScanInfo)
        break
      case 'login':
        this.login.emit(e.payload as UserInfo)
        break
      case 'logout':
        this.logout.emit(e.payload as UserInfo)
        break
      case 'message':
        this.message.emit(e.payload)
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
        this.log.silly('WechatyComponent', 'onIo(%s): %s', e.name, e.payload)
        break

      default:
        this.log.warn('WechatyComponent', 'onIo() unknown event name: %s[%s]', e.name, e.payload)
        break
    }
  }

  public reset(reason: string) {
    this.log.verbose('WechatyComponent', 'reset(%s)', reason)

    const resetEvent: IoEvent = {
      name: 'reset',
      payload: reason,
    }
    if (!this.ioService) {
      throw new Error('no ioService')
    }
    this.ioService.event.next(resetEvent)
  }

  public shutdown(reason: string) {
    this.log.verbose('WechatyComponent', 'shutdown(%s)', reason)

    const shutdownEvent: IoEvent = {
      name: 'shutdown',
      payload: reason,
    }
    if (!this.ioService) {
      throw new Error('no ioService')
    }
    this.ioService.event.next(shutdownEvent)
  }

  startTimer() {
    this.log.verbose('WechatyComponent', 'startTimer()')
    this.ender = new Subject()

    // https://github.com/angular/protractor/issues/3349#issuecomment-232253059
    // https://github.com/juliemr/ngconf-2016-zones/blob/master/src/app/main.ts#L38
    this.ngZone.runOutsideAngular(() => {
      this.timer = Observable.interval(3000)
          .do(i => { this.log.verbose('do', ' %d', i) })
          .takeUntil(this.ender)
          // .publish()
          .share()
    })

    this.timerSub = this.timer.subscribe(t => {
      this.counter = t

      if (!this.ioService) {
        throw new Error('no ioService')
      }
      this.ioService.rpcDing(this.counter)
      // this.message.emit('#' + this.token + ':' + dong)
    })

  }

  endTimer() {
    this.log.verbose('WechatyComponent', 'endTimer()')

    if (this.timerSub) {
      this.timerSub.unsubscribe()
      this.timerSub = null
    }
    // this.timer = null

    if (this.ender) {
      this.ender.next(null)
      // this.ender = null
    }
  }

  logoff(reason?: string) { // use the name `logoff` here to prevent conflict with @Output(logout)
    this.log.silly('WechatyComponent', 'logoff(%s)', reason)

    const quitEvent: IoEvent = {
      name: 'logout',
      payload: reason,
    }
    this.ioService.event.next(quitEvent)
  }

  public get readyState() {
    return this.ioService.readyState
  }

}
