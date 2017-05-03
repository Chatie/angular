import {
  beforeEach, beforeEachProviders,
  describe, xdescribe,
  expect, it, xit,
  async, inject
} from '@angular/core/testing'

import { Brolog } from 'brolog'

import { WechatyCoreCmp } from './wechaty-core'

beforeEachProviders(() => [WechatyCoreCmp, Brolog])

describe('WechatyCoreCmp Test', () => {
  it('should create the app'
    , inject([WechatyCoreCmp], (wechaty: WechatyCoreCmp) => {
      expect(wechaty).toBeTruthy()
    })
  )

  it('should have as content "app works!"',
    inject([WechatyCoreCmp], (wechaty: WechatyCoreCmp) => {
      expect(wechaty.token).toEqual('')
    })
  )
})
