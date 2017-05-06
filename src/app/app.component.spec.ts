import { TestBed, async } from '@angular/core/testing'
import { FormsModule } from '@angular/forms'

import { Brolog } from 'brolog'

import { WechatyModule }  from '../wechaty/wechaty.module'
import { AppComponent }   from './app.component'

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        WechatyModule,
      ],
      declarations: [
        AppComponent,
      ],
      providers: [
        Brolog,
      ],
    }).compileComponents()
  }))

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.debugElement.componentInstance
    expect(app).toBeTruthy()
  }))

  it(`should have as title 'Wechaty'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.debugElement.componentInstance
    expect(app.title).toContain('Wechaty')
  }))

  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    const compiled = fixture.debugElement.nativeElement
    expect(compiled.querySelector('h1').textContent).toContain('Wechaty')
  }))
})
