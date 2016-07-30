import {
  Component
} from '@angular/core'

import { Brolog } from 'brolog'

import { WechatyCoreCmp } from '../src/wechaty-core.cmp/index'

@Component({
  selector: 'wechaty-app'
  , moduleId: module.id
  , templateUrl: 'app.cmp.html'
  , directives: [
    WechatyCoreCmp
  ]
})

export class WechatyAppCmp {
  title = 'Wechaty APP Component'

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
