#!/usr/bin/env bash
set -e

npm run lint
npm run clean
npm run ng:packagr

#rm -fr @chatie/db/node_modules

cp -Rav dist/* ../app/node_modules/@chatie/angular/
