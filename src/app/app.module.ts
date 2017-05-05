import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { Brolog }         from 'brolog'

import { WechatyModule } from '../wechaty/wechaty.module'

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    WechatyModule,
  ],
  providers: [
    {
      provide: Brolog,
      useFactory() { return Brolog.instance('silly') }
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
