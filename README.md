# @chatie/angular

Wechaty Core Web Component for Angular (WechatyCoreCmp)

This package is part of [Chatie](https://github.com/chatie) Project: https://www.chatie.io

# TL;DR;

Let's see code example:

```html
<wechaty
  #wechaty
  token="WECHATY_TOKEN"

  (scan)      = "onEvent('scan'      , $event)"
  (login)     = "onEvent('login'     , $event)"
>

  <button (click)="wechaty.logoff()">   Logoff</button>

</wechaty>
```

Moer details, see code. ;-]

# Reference

* [How to build and publish an Angular module](https://medium.com/@cyrilletuzi/how-to-build-and-publish-an-angular-module-7ad19c0b4464)
* [Understanding Angular modules (NgModule) and their scopes](https://medium.com/@cyrilletuzi/understanding-angular-modules-ngmodule-and-their-scopes-81e4ed6f7407)
* [Making your Angular 2 library statically analyzable for AoT](https://medium.com/@isaacplmann/making-your-angular-2-library-statically-analyzable-for-aot-e1c6f3ebedd5)
* [Getting your Angular 2 library ready for AoT](https://medium.com/@isaacplmann/getting-your-angular-2-library-ready-for-aot-90d1347bcad)

Version History
-----------------

## v0.1.0 (May 2017)

1. Upgrade Angular 4.1
1. NgModule-ize Wachaty Component

## v0.0.1 (Jul 2016)

1. Modulized Angular 2 Component: `wechaty-core`
1. Support all(and same) IO Events of [Wechaty](https://github.com/chatie/wechaty)

Known Issues & Support
-----------------
Github Issue - https://github.com/chatie/angular/issues

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
