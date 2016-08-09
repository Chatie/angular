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
  lastEvents: any = {
    'heartbeat': {}
    , 'scan': {}
    , 'login': {}
    , 'message': {}
    , 'logout': {}
    , 'error': {}
  }
  eventNameList: string[] = Object.keys(this.lastEvents)

  constructor(private log: Brolog) {
    log.silly('WechatyAppCmp', 'constructor()')
  }

  onEvent(name: string, data: any) {
    this.log.info('WechatyAppCmp', 'onEvent(%s, %s)', name, data)
    this.lastEvents[name] = { data, timestamp: new Date() }
    this.eventNameList = Object.keys(this.lastEvents).sort((a, b) => {
      return this.lastEvents[b].timestamp - (this.lastEvents[a].timestamp || 0) 
    })
  }
}
