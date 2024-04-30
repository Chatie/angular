# Wechaty Web Component ![wechaty](https://img.shields.io/badge/HTML5-%3Cwechaty%20%2F%3E-brightgreen)

[![npm version](https://badge.fury.io/js/%40chatie%2Fangular.svg)](https://www.npmjs.com/package/@chatie/angular) ![NPM](https://github.com/Chatie/angular/workflows/NPM/badge.svg)

![Angular Library](https://chatie.github.io/angular/images/library-in-angular.jpg)

> Picture credit: [How to create an Angular library](http://www.dzurico.com/how-to-create-an-angular-library/)

[![Powered by Wechaty](https://img.shields.io/badge/Powered%20By-Wechaty-brightgreen.svg)](https://github.com/Wechaty/wechaty)

Wechaty Web Component NgModule Powered by Angular 9 & ng-packagr

## USAGE

### Demo

1. StackBlitz: <https://stackblitz.com/edit/chatie-angular?file=src%2Fapp%2Fapp.component.html>
1. Plunker: <https://embed.plnkr.co/qi2au1/?show=app.component.ts,app.component.html,preview&deferRun&autoCloseSidebar=true>

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

## REFERENCES

* [How to build and publish an Angular module](https://medium.com/@cyrilletuzi/how-to-build-and-publish-an-angular-module-7ad19c0b4464)
* [Understanding Angular modules (NgModule) and their scopes](https://medium.com/@cyrilletuzi/understanding-angular-modules-ngmodule-and-their-scopes-81e4ed6f7407)
* [Making your Angular 2 library statically analyzable for AoT](https://medium.com/@isaacplmann/making-your-angular-2-library-statically-analyzable-for-aot-e1c6f3ebedd5)
* [Getting your Angular 2 library ready for AoT](https://medium.com/@isaacplmann/getting-your-angular-2-library-ready-for-aot-90d1347bcad)
* [Documentation for Angular Metadata Raw](https://gist.github.com/chuckjaz/65dcc2fd5f4f5463e492ed0cb93bca60)
* [Ahead-of-Time Compilation in Angular](http://blog.mgechev.com/2016/08/14/ahead-of-time-compilation-angular-offline-precompilation/)
* [Plunker - Adding the embed to your website](https://ggoodman.gitbooks.io/plunker/content/embed.html)

## NPM

* [Working with scoped packages](https://docs.npmjs.com/getting-started/scoped-packages)

## RESOURCES

* [Angular-AI-Chat-Bot](https://github.com/PoghosyanHayk/Angular-AI-Chat-Bot/tree/master/chat-bot)

## CHANGELOG

### v0.8 master (Nov, 2020)

1. Upgrde Angulr version from 9 to 10

### v0.6 (Mar 23, 2020)

1. Upgrade Angular version from 6 to 9
1. Enable GitHub Actions
1. Demo on <StackBlitz.com>

### v0.4 (May 28th, 2018)

1. Upgrade RxJS version from 5 to 6
1. Upgrade Angular version from 5 to 6

### v0.3 (May 1st, 2018)

1. Support CI/CD to NPM@next

### v0.2 (Apr 2018)

1. Upgrade Angular from v4 to v5
1. use `ng-packagr` to pack NgModule(instead of tsc&rollup by hand)

### v0.1 (May 2017)

1. Upgrade Angular from v2 to v4
1. NgModule-ize Wachaty Component
1. Playground: <https://chatie.io/angular/>

### v0.0.1 (Jul 2016)

1. Modulized Angular 2 Component: `wechaty-core`
1. Support all(and same) IO Events of [Wechaty](https://github.com/chatie/wechaty)

## SUPPORT

GitHub Issue - https://github.com/chatie/angular/issues

## Author

[Huan Li](https://github.com/huan) ([LinkedIn](http://linkedin.com/in/huan42)) huan@chatie.io

[![Profile of Huan Li (李卓桓) on StackOverflow](https://stackexchange.com/users/flair/265499.png)](https://stackexchange.com/users/265499)

## Copyright & License

* Code & Docs © 2016-now Huan LI \<zixia@zixia.net\>
* Code released under the Apache-2.0 License
* Docs released under Creative Commons
