import { BrowserModule }  from '@angular/platform-browser'
import { NgModule }       from '@angular/core'
import { FormsModule }    from '@angular/forms'
import { HttpClientModule }     from '@angular/common/http'

import {
  log,
  Brolog,
}                         from 'brolog'

import { WechatyModule }  from '../wechaty/wechaty.module'

import { AppComponent }   from './app.component'

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    WechatyModule,
  ],
  providers: [
    {
      provide:  Brolog,
      useValue: log,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
