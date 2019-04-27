'use strict';

const path = require('path');
const coffee = require('coffee');
const assertFile = require('assert-file');
const { fs } = require('mz');
const { rimraf, mkdirp } = require('mz-modules');

describe('test/not-empty.test.js', () => {
  const fixtures = path.join(__dirname, 'fixtures');
  const tmpDir = path.join(__dirname, '.tmp');

  beforeEach(async () => {
    await rimraf(tmpDir);
    await mkdirp(tmpDir);
  });

  it('should check whether empty and fail', async () => {
    await fs.writeFile(path.join(tmpDir, 'somefile.md'), '## test');
    await coffee.fork(path.join(fixtures, 'simple/bin/cli.js'), [], { cwd: tmpDir })
      // .debug()
      .waitForPrompt()
      .writeKey('example\n')
      .writeKey('ENTER')
      .writeKey('DOWN', 'ENTER')
      .expect('stderr', /tmp it not empty/)
      .expect('code', 1)
      .end();
  });

  it('should check whether empty with --force', async () => {
    await fs.writeFile(path.join(tmpDir, 'somefile.md'), '## test');
    await coffee.fork(path.join(fixtures, 'simple/bin/cli.js'), [ '--force' ], { cwd: tmpDir })
      // .debug()
      .waitForPrompt()
      .writeKey('example\n')
      .writeKey('ENTER')
      .writeKey('DOWN', 'ENTER')
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/README.md`, /name = example/);
    assertFile(`${tmpDir}/somefile.md`, /## test/);
  });

  it('should check whether empty', async () => {
    await fs.writeFile(path.join(tmpDir, '.eslintrc'), '{}');
    await coffee.fork(path.join(fixtures, 'simple/bin/cli.js'), [], { cwd: tmpDir })
      // .debug()
      .waitForPrompt()
      .writeKey('example\n')
      .writeKey('ENTER')
      .writeKey('DOWN', 'ENTER')
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/README.md`, /name = example/);
  });
});
