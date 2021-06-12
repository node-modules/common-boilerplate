'use strict';

const path = require('path');
const coffee = require('coffee');
const assertFile = require('assert-file');
const { rimraf, mkdirp } = require('mz-modules');

describe('test/runscript.test.js', () => {
  const fixtures = path.join(__dirname, 'fixtures');
  const tmpDir = path.join(__dirname, '.tmp');

  beforeEach(async () => {
    await rimraf(tmpDir);
    await mkdirp(tmpDir);
  });

  it('should work', async () => {
    await coffee.fork(path.join(fixtures, 'runscript/bin/cli.js'), [], { cwd: tmpDir })
      .debug()
      .expect('stdout', /npm install .* --no-package-lock --no-optional/)
      .expect('stdout', /argv:\s*--grep=home/)
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/node_modules/lodash.get/package.json`);
    assertFile.fail(`${tmpDir}/node_modules/coffee/package.json`);
  });
});
