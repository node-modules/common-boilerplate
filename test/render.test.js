'use strict';

const testUtils = require('..').testUtils;

describe('test/render.test.js', () => {
  it('should work', () => {
    const options = {
      baseDir: 'render',
      args: [ '--name=example', '--test=123', '--a.c=789' ],
    };
    return testUtils.run(options)
      // .debug()
      .write('this is a desc\n')
      .write('456\n')
      .expectFile('README.md', 'name = example')
      .expectFile('README.md', 'description = this is a desc')
      .expectFile('README.md', 'test = 123')
      .expectFile('README.md', 'nested = 456')
      .expectFile('README.md', 'nested2 = 789')
      .expectFile('README.md', 'skip = {{ skip }}')
      .expectFile('README.md', 'empty = __')
      .expect('code', 0)
      .end();
  });
});
