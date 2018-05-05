let VERSION: string
try {
  VERSION = require('../package.json').version
} catch (e) {
  VERSION = '0.0.0'
}

export {
  VERSION,
}

