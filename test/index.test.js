'use strict';

const path = require('path');
const { rimraf, mkdirp } = require('mz-modules');
const { fork, KEYS } = require('./utils');

describe('test/index.test.js', () => {
  const cwd = path.join(__dirname, '.tmp');

  beforeEach(function* () {
    yield rimraf(cwd);
    yield mkdirp(cwd);
  });

  afterEach(function* () {
    // yield rimraf(cwd);
  });

  it('should work', function* () {
    yield fork(path.join(__dirname, 'fixtures/normal/bin/cli.js'), [ ], { cwd })
      .debug()
      .mockPrompt('example')
      .mockPrompt('this is a desc')
      .mockPrompt(KEYS.DOWN + KEYS.DOWN + KEYS.UP)
      .end();
  });
});
