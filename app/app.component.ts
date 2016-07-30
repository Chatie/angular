import {
  Component
  // , ChangeDetectionStrategy
} from '@angular/core'

import { Brolog } from 'brolog'

import { WechatyCoreCmp } from '../src/wechaty-core.component/index'

@Component({
  selector: 'wechaty-app'
  , moduleId: module.id
  , templateUrl: 'app.component.html'
  , directives: [
    WechatyCoreCmp
  ]
  // , changeDetection: ChangeDetectionStrategy.Default
})

export class WechatyAppCmp {
  title = 'Wechaty APP'

  token: string
  lastEvents: any = {}
  lastEventName: string

  constructor(private log: Brolog) {
    log.verbose('WechatyAppCmp', 'constructor()')
  }

  onEvent(name: string, data: any) {
    this.log.info('WechatyAppCmp', 'onEvent(%s, %s)', name, data)
    this.lastEventName = name
    this.lastEvents[name] = data
  }
}
