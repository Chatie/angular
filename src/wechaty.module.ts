import { NgModule }         from '@angular/core';
import { CommonModule }     from '@angular/common';

import { WechatyComponent } from './wechaty.component'

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    WechatyComponent,
  ],
  // providers: [ ]
  exports: [
    WechatyComponent,
  ]
})
export class WechatyModule {}

export default WechatyModule

export * from './wechaty.component'
