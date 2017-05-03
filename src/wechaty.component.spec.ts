import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Brolog } from 'brolog'

import { WechatyComponent } from './wechaty.component';

describe('WechatyComponent', () => {
  let component: WechatyComponent;
  let fixture: ComponentFixture<WechatyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WechatyComponent ],
      providers: [
        Brolog,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WechatyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
