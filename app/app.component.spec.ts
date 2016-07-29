import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing'

import { AppComponent } from './app.component'

beforeEachProviders(() => [
  AppComponent
])

describe('App: NgTest', () => {
  it('should create the app'
      , inject([AppComponent], (app: AppComponent) => {
    expect(app).toBeTruthy()
  }))

  it('should have as title "Wechaty APP"'
      , inject([AppComponent], (app: AppComponent) => {
    expect(app.title).toEqual('Wechaty APP')
  }))
})
