import {
  TestBed,
}                       from '@angular/core/testing'

import { Brolog }       from 'brolog'

import {
  Injector,
}                       from '@angular/core'

import { IoService }    from './io'

describe('IoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Brolog,
          useFactory() { return Brolog.instance('info') },
        },
        Injector,
      ],
    })
  })

  // it('should ...', inject([IoService], (service: IoService) => {
  //   expect(service).toBeTruthy()
  // }))

  it('should create', () => {
    const ioService = new IoService()
    expect(ioService).toBeTruthy()
  })

  it('should has version', () => {
    const ioService = new IoService()
    expect(/^\d+\.\d+\.\d+$/.test(ioService.version)).toBeTruthy()
  })

})
