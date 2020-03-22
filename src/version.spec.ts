import { VERSION } from './version'

describe('Make sure the VERSION is fresh in source code', () => {

  it('version should be 0.0.0 in source code, only updated before publish to NPM', () => {
    expect(VERSION).toEqual('0.0.0')
  })

})
