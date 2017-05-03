import { TestBed, inject } from '@angular/core/testing';

import { Brolog }   from 'brolog'
import { ConfigService }  from './config.service'
import {
  Injector
} from '@angular/core'

import { IoService } from './io.service';

describe('IoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
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

  it('should ...', inject([Injector], (injector: Injector) => {
    const ioService = new IoService(injector, 'token')
    expect(ioService).toBeTruthy();
  }));

});
