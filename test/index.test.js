'use strict';

const path = require('path');
const { rimraf, mkdirp } = require('mz-modules');
const coffee = require('coffee');

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
    const cli = path.join(__dirname, 'fixtures/normal/bin/cli.js');
    yield coffee.fork(cli, [ ], { cwd })
      .debug()
      .write('example\n')
      // .write('this is an example boilerplate\n')
      // .expect('stdout', /"urllib": "\d+.\d+.\d+/)
      // .expect('code', 0)
      .end();
  });
});
