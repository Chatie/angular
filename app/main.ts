import { bootstrap }    from '@angular/platform-browser-dynamic'
import { Brolog } from 'brolog' // Npmlog for Browser - https://github.com/zixia/brolog

import { WechatyAppCmp} from './app.component'

bootstrap(WechatyAppCmp, [
  Brolog('SILLY')
])
.catch(err => console.error(err))
