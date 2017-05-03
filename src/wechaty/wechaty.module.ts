import { NgModule }         from '@angular/core'
import { CommonModule }     from '@angular/common'

import { WechatyComponent } from './wechaty.component'

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    WechatyComponent,
  ],
  exports: [
    WechatyComponent,
  ]
})
export class WechatyModule {}

export { WechatyComponent } from './wechaty.component'
