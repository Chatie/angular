export default {
  entry: 'dist/wechaty.module.js',
  dest: 'bundles/wechaty.es6.umd.js',
  sourceMap: true,
  format: 'umd',
  moduleName: 'ng.wechaty',
  globals: {
    '@angular/core': 'ng.core',
    'rxjs/Observable': 'Rx',
    'rxjs/ReplaySubject': 'Rx',
    'rxjs/add/operator/map': 'Rx.Observable.prototype',
    'rxjs/add/operator/mergeMap': 'Rx.Observable.prototype',
    'rxjs/add/observable/fromEvent': 'Rx.Observable',
    'rxjs/add/observable/of': 'Rx.Observable'
  }
}
