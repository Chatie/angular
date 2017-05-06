import { version } from '../../package.json'

import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  Output,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
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
export class WechatyComponent implements OnInit, OnChanges, OnDestroy {
  @Output() message   = new EventEmitter<string>()
  @Output() scan      = new EventEmitter<ScanInfo>()
  @Output() login     = new EventEmitter<UserInfo>()
  @Output() logout    = new EventEmitter<UserInfo>()
  @Output() error     = new EventEmitter<Error>()
  @Output() heartbeat = new EventEmitter<any>()

  @Input() token: string

  private timer: Observable<any>
  private timerSub: Subscription | null = null
  private ender: Subject<any>

  private ioService: IoService

  public version = version

  counter = 0
  timestamp = new Date()

  constructor(
    private ngZone: NgZone,
    private log: Brolog,
  ) {
    this.log.verbose('WechatyComponent', 'constructor() v%s', this.version)
  }

  async ngOnInit() {
    this.log.verbose('WechatyComponent', 'ngOninit() with token: ' + this.token)

    this.ioService = new IoService()
    /**
     * @Input(token) is not inittialized in constructor()
     */
    if (this.token) {
      this.ioService.token(this.token)
      await this.ioService.start()
    }

    this.ioService.socket.subscribe(this.onIo.bind(this))

    // this.startTimer()
  }

  ngOnChanges(changes: SimpleChanges) {
    this.log.verbose('WechatyComponent', 'ngOnChanges({#:%s})', Object.keys(changes).length)

    if (changes.token) {
      this.log.verbose('WechatyComponent', 'ngOnChanges() token changed from %s to %s',
                                          changes.token.previousValue,
                                          changes.token.currentValue,
                      )
      const token = changes.token.currentValue.trim()
      this.ioService.token(token)
      this.ioService.restart()
    }
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
      name: 'reset'
      , payload: reason
    }
    if (!this.ioService) {
      throw new Error('no ioService')
    }
    this.ioService.socket.next(resetEvent)
  }

  public shutdown(reason: string) {
    this.log.verbose('WechatyComponent', 'shutdown(%s)', reason)

    const shutdownEvent: IoEvent = {
      name: 'shutdown'
      , payload: reason
    }
    if (!this.ioService) {
      throw new Error('no ioService')
    }
    this.ioService.socket.next(shutdownEvent)
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
      this.ioService.ding(this.counter)
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
      name: 'logout'
      , payload: reason
    }
    this.ioService.socket.next(quitEvent)
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
}
