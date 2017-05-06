import json from 'rollup-plugin-json'

export default {
  entry: 'dist/wechaty/wechaty.module.js',
  dest: 'bundles/wechaty.es6.umd.js',
  sourceMap: true,
  format: 'umd',
  moduleName: 'chatie.wechaty',
  globals: {
    '@angular/core': 'ng.core',
    'rxjs/Observable': 'Rx',
    'rxjs/ReplaySubject': 'Rx',
    'rxjs/add/operator/map': 'Rx.Observable.prototype',
    'rxjs/add/operator/mergeMap': 'Rx.Observable.prototype',
    'rxjs/add/observable/fromEvent': 'Rx.Observable',
    'rxjs/add/observable/of': 'Rx.Observable'
  },
  plugins: [
    json({
      // All JSON files will be parsed by default,
      // but you can also specifically include/exclude files
      // include: 'node_modules/**',  // Default: undefined
      // exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],  // Default: undefined
	  preferConst: true, // Default: false
    })
  ]
}
