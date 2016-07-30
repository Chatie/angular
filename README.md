# wechaty-angular-core
Wechaty Core Web Component for Angular (WechatyCoreCmp)

This package is part of [Wechaty](https://github.com/zixia/wechaty): https://www.wechaty.io

# TL;DR;

Let's see code example:

```html
<wechaty-core 
  #wechaty
  token="WECHATY_TOKEN"
  
  (scan)      = "onEvent('scan'      , $event)"
  (login)     = "onEvent('login'     , $event)"
>

  <button (click)="wechaty.logoff()">   Logoff</button>

</wechaty-core>
```

Moer details, see code. ;-]


Version History
-----------------

## v0.0.1 (master)

1. Modulized Angular Component: `wechaty-core`
1. Support all(and same) IO Events of [Wechaty](https://github.com/zixia/wechaty)

Known Issues & Support
-----------------
Github Issue - https://github.com/zixia/wechaty-angular-core/issues

Author
-----------------
Zhuohuan LI <zixia@zixia.net> (http://linkedin.com/in/zixia)

<a href="http://stackoverflow.com/users/1123955/zixia">
  <img src="http://stackoverflow.com/users/flair/1123955.png" width="208" height="58" alt="profile for zixia at Stack Overflow, Q&amp;A for professional and enthusiast programmers" title="profile for zixia at Stack Overflow, Q&amp;A for professional and enthusiast programmers">
</a>

Copyright & License
-------------------
* Code & Docs 2016© zixia
* Code released under the MIT license
* Docs released under Creative Commons
