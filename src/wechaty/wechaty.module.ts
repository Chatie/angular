import { NgModule }         from '@angular/core'

import { WechatyComponent } from './wechaty.component'

@NgModule({
  id: 'wechaty',
  declarations: [
    WechatyComponent,
  ],
  exports: [
    WechatyComponent,
  ]
})
export class WechatyModule {}

export { WechatyComponent } from './wechaty.component'
