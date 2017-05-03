import { Component } from '@angular/core';

import { Brolog } from 'brolog'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

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
    log.silly('AppComponent', 'constructor()')
  }

  onEvent(name: string, data: any) {
    this.log.info('AppComponent', 'onEvent(%s, %s)', name, data)
    this.lastEvents[name] = { data, timestamp: new Date() }
    this.eventNameList = Object.keys(this.lastEvents).sort((a, b) => {
      return this.lastEvents[b].timestamp - (this.lastEvents[a].timestamp || 0)
    })
  }
}
