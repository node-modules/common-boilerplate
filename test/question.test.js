'use strict';

const path = require('path');
const coffee = require('coffee');
const assertFile = require('assert-file');
const { rimraf, mkdirp } = require('mz-modules');
const mock = require('mm');
const runscript = require('runscript');

describe('test/question.test.js', () => {
  const fixtures = path.join(__dirname, 'fixtures');
  const tmpDir = path.join(__dirname, '.tmp');

  beforeEach(async () => {
    await rimraf(tmpDir);
    await mkdirp(tmpDir);
    mock.restore();
    mock(process.env, 'BOILERPLATE_TEST', true);
    await runscript('git init', { cwd: tmpDir });
  });

  it('should work', async () => {
    await coffee.fork(path.join(fixtures, 'question/bin/cli.js'), [], { cwd: tmpDir })
      .debug()
      .waitForPrompt()
      .writeKey('@tz\n')
      .writeKey('test\n')
      .writeKey('desc\n')
      .writeKey('ENTER')
      .writeKey('ENTER')
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/package.json`, {
      name: '@tz/test',
      description: 'desc',
      homepage: 'https://github.com/tz/test',
      repository: 'git@github.com:tz/test.git',
      npm_module: 'true',
    });
  });

  it('should work without scope @', async () => {
    await coffee.fork(path.join(fixtures, 'question/bin/cli.js'), [], { cwd: tmpDir })
      .debug()
      .waitForPrompt()
      .writeKey('tz\n')
      .writeKey('test\n')
      .writeKey('desc\n')
      .writeKey('ENTER')
      .writeKey('ENTER')
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/package.json`, {
      name: '@tz/test',
    });
  });

  it('should work with prefix', async () => {
    await coffee.fork(path.join(fixtures, 'question/bin/cli.js'), [ '--prefix=create-' ], { cwd: tmpDir })
      .debug()
      .waitForPrompt()
      .writeKey('@tz\n')
      .writeKey('test\n')
      .writeKey('desc\n')
      .writeKey('ENTER')
      .writeKey('ENTER')
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/package.json`, {
      name: '@tz/create-test',
      description: 'desc',
      homepage: 'https://github.com/tz/create-test',
      repository: 'git@github.com:tz/create-test.git',
      npm_module: 'true',
    });
  });

});
