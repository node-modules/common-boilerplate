'use strict';

const path = require('path');
const coffee = require('coffee');
const assertFile = require('assert-file');
const { rimraf, mkdirp } = require('mz-modules');
const mock = require('mm');

describe('test/question.test.js', () => {
  const fixtures = path.join(__dirname, 'fixtures');
  const tmpDir = path.join(__dirname, '.tmp');

  beforeEach(async () => {
    await rimraf(tmpDir);
    await mkdirp(tmpDir);
    mock.restore();
    mock(process.env, 'BOILERPLATE_TEST', true);
  });

  it('should work', async () => {
    await coffee.fork(path.join(fixtures, 'question/bin/cli.js'), [], { cwd: tmpDir })
      .debug()
      .waitForPrompt()
      .writeKey('@ali\n')
      .writeKey('test\n')
      .writeKey('eggjs/test\n')
      .writeKey('ENTER')
      .writeKey('ENTER')
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/package.json`, {
      name: '@ali/test',
      description: 'desc',
      homepage: 'https://github.com/eggjs/test',
      repository: 'git@github.com:eggjs/test.git',
      npm_module: 'true',
    });
  });

  it('should work without scope @', async () => {
    await coffee.fork(path.join(fixtures, 'question/bin/cli.js'), [], { cwd: tmpDir })
      .debug()
      .waitForPrompt()
      .writeKey('ali\n')
      .writeKey('test\n')
      .writeKey('eggjs/test\n')
      .writeKey('ENTER')
      .writeKey('ENTER')
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/package.json`, {
      name: '@ali/test',
    });
  });

});
