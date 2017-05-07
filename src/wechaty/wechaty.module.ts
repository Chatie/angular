import { NgModule }         from '@angular/core'

import { WechatyComponent } from './wechaty.component'

@NgModule({
  id: 'wechaty',
  declarations: [
    WechatyComponent,
  ],
  exports: [
    WechatyComponent,
  ],
})
export class WechatyModule {}

export * from './wechaty.component'
export { ReadyState } from './io'
