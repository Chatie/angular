# WECHATY NGMODULE

[![Build Status](https://travis-ci.org/Chatie/angular.svg?branch=master)](https://travis-ci.org/Chatie/angular)
[![npm version](https://badge.fury.io/js/%40chatie%2Fangular.svg)](https://www.npmjs.com/package/@chatie/angular)
(https://badges.greenkeeper.io/Chatie/db.svg)](https://greenkeeper.io/)

Wechaty Web Component NgModule Powered by Angular 5 & ng-packagr

![Angular Library](https://chatie.github.io/angular/images/library-in-angular.jpg)

> Picture credit: [How to create an Angular library](http://www.dzurico.com/how-to-create-an-angular-library/)

## TL;DR

### Demo

<https://chatie.io/angular/>

Talk is cheap, show me the code:

### App Module

```ts
import { WechatyModule }  from '@chatie/angular'

@NgModule({
  ...
  imports: [
    WechatyModule,
  ],
  ...
})

```

### Html Component

```html
<wechaty
  #wechaty
  token="WECHATY_TOKEN"

  (error)     = "onEvent('error'     , $event)"
  (heartbeat) = "onEvent('heartbeat' , $event)"
  (login)     = "onEvent('login'     , $event)"
  (logout)    = "onEvent('logout'    , $event)"
  (message)   = "onEvent('message'   , $event)"
  (scan)      = "onEvent('scan'      , $event)"
>
</wechaty>

<button (click)="wechaty.shutdown()"> Shutdown</button>

```

Moer details, see code. ;-]

## Reference

* [How to build and publish an Angular module](https://medium.com/@cyrilletuzi/how-to-build-and-publish-an-angular-module-7ad19c0b4464)
* [Understanding Angular modules (NgModule) and their scopes](https://medium.com/@cyrilletuzi/understanding-angular-modules-ngmodule-and-their-scopes-81e4ed6f7407)
* [Making your Angular 2 library statically analyzable for AoT](https://medium.com/@isaacplmann/making-your-angular-2-library-statically-analyzable-for-aot-e1c6f3ebedd5)
* [Getting your Angular 2 library ready for AoT](https://medium.com/@isaacplmann/getting-your-angular-2-library-ready-for-aot-90d1347bcad)
* [Documentation for Angular Metadata Raw](https://gist.github.com/chuckjaz/65dcc2fd5f4f5463e492ed0cb93bca60)
* [Ahead-of-Time Compilation in Angular](http://blog.mgechev.com/2016/08/14/ahead-of-time-compilation-angular-offline-precompilation/)
* [Plunker - Adding the embed to your website](https://ggoodman.gitbooks.io/plunker/content/embed.html)

### NPM

* [Working with scoped packages](https://docs.npmjs.com/getting-started/scoped-packages)

# CHANGELOG

## v0.2 master (Apr 2018)

1. Upgrade Angular from v4 to v5
1. use `ng-packagr` to pack NgModule

## v0.1 (May 2017)

1. Upgrade Angular from v2 to v4
1. NgModule-ize Wachaty Component
1. Playground: <https://chatie.io/angular/>

## v0.0.1 (Jul 2016)

1. Modulized Angular 2 Component: `wechaty-core`
1. Support all(and same) IO Events of [Wechaty](https://github.com/chatie/wechaty)

## Known Issues & Support

Github Issue - https://github.com/chatie/angular/issues

# AUTHOR

Huan LI <zixia@zixia.net> (http://linkedin.com/in/zixia)

<a href="http://stackoverflow.com/users/1123955/zixia">
  <img src="http://stackoverflow.com/users/flair/1123955.png" width="208" height="58" alt="profile for zixia at Stack Overflow, Q&amp;A for professional and enthusiast programmers" title="profile for zixia at Stack Overflow, Q&amp;A for professional and enthusiast programmers">
</a>

# COPYRIGHT & LICENSE

* Code & Docs ©2016-2018 zixia
* Code released under the Apache-2.0 license
* Docs released under Creative Commons
