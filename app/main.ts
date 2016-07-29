import { bootstrap }    from '@angular/platform-browser-dynamic'
import { AppComponent}  from './app.component'

import { Brolog } from 'brolog' // Npmlog for Browser - https://github.com/zixia/brolog

bootstrap(AppComponent, [
  Brolog('SILLY')
])
.catch(err => console.error(err))
