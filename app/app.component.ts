import { Component } from '@angular/core'
import { WechatyCoreComponent } from '../src/wechaty-core.component/index'

@Component({
  selector: 'wechaty-app'
  , moduleId: module.id
  , templateUrl: 'app.component.html'
  , directives: [
    WechatyCoreComponent
  ]
})

export class AppComponent {
  title = 'Wechaty APP'
  constructor() {}
}
