'use strict';

const path = require('path');
const coffee = require('coffee');
const assertFile = require('assert-file');
const { rimraf, mkdirp } = require('mz-modules');

describe('test/httpclient.test.js', () => {
  const fixtures = path.join(__dirname, 'fixtures');
  const tmpDir = path.join(__dirname, '.tmp');

  beforeEach(async () => {
    await rimraf(tmpDir);
    await mkdirp(tmpDir);
  });

  it('should work', async () => {
    await coffee.fork(path.join(fixtures, 'httpclient/bin/cli.js'), [], { cwd: tmpDir })
      .debug()
      .waitForPrompt()
      .writeKey('example\n')
      .writeKey('this is a desc\n')
      .writeKey('456')
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/README.md`, /foo = common-boilerplate@\d+\.\d+\.\d+/);
  });
});
