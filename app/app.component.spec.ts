import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing'

import { WechatyAppCmp } from './app.component'

beforeEachProviders(() => [
  WechatyAppCmp
])

describe('App: NgTest', () => {
  it('should create the app'
      , inject([WechatyAppCmp], (app: WechatyAppCmp) => {
    expect(app).toBeTruthy()
  }))

  it('should have as title "Wechaty APP"'
      , inject([WechatyAppCmp], (app: WechatyAppCmp) => {
    expect(app.title).toEqual('Wechaty APP')
  }))
})
