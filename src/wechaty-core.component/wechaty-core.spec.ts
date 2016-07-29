import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing'

import { Brolog } from 'brolog'

import { WechatyCoreComponent } from './wechaty-core'

beforeEachProviders(() => [WechatyCoreComponent, Brolog])

describe('WechatyCoreComponent Test', () => {
  it('should create the app'
    , inject([WechatyCoreComponent], (wechaty: WechatyCoreComponent) => {
      expect(wechaty).toBeTruthy()
    })
  )

  it('should have as content "app works!"',
    inject([WechatyCoreComponent], (wechaty: WechatyCoreComponent) => {
      expect(wechaty.token).toEqual('')
    })
  )
})
