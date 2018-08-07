'use strict';

const testUtils = require('..').testUtils;

describe('test/test-utils.test.js', () => {
  it('should work', () => {
    return testUtils.run('test-utils')
      .expectFile('README.md', /# README/)
      .expect('code', 0)
      .end();
  });
});
