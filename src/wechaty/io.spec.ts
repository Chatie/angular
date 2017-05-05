import { TestBed, inject } from '@angular/core/testing';

import { Brolog }   from 'brolog'

import {
  Injector
} from '@angular/core'

import { IoService } from './io';

describe('IoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Brolog,
          useFactory() { return Brolog.instance('info') },
        },
        Injector,
      ]
    });
  });

  // it('should ...', inject([IoService], (service: IoService) => {
  //   expect(service).toBeTruthy();
  // }));

  it('should ...', inject([Injector], () => {
    const ioService = new IoService()
    expect(ioService).toBeTruthy();
  }));

});
