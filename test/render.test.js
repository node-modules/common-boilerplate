'use strict';

const path = require('path');
const coffee = require('coffee');
const assertFile = require('assert-file');
const { rimraf, mkdirp } = require('mz-modules');
const mock = require('mm');

describe('test/render.test.js', () => {
  const fixtures = path.join(__dirname, 'fixtures');
  const tmpDir = path.join(__dirname, '.tmp');

  beforeEach(async () => {
    await rimraf(tmpDir);
    await mkdirp(tmpDir);
    mock.restore();
    mock(process.env, 'BOILERPLATE_TEST', true);
  });

  it('should work', async () => {
    await coffee.fork(path.join(fixtures, 'render/bin/cli.js'), [ '--test=123', '--a.c=789' ], { cwd: tmpDir })
      // .debug()
      .waitForPrompt()
      .writeKey('example\n')
      .writeKey('this is a desc\n')
      .writeKey('456')
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/README.md`, 'name = example');
    assertFile(`${tmpDir}/README.md`, 'description = this is a desc');
    assertFile(`${tmpDir}/README.md`, 'test = 123');
    assertFile(`${tmpDir}/README.md`, 'nested = 456');
    assertFile(`${tmpDir}/README.md`, 'nested2 = 789');
    assertFile(`${tmpDir}/README.md`, 'skip = {{ skip }}');
    assertFile(`${tmpDir}/README.md`, 'empty = __');

    // not treat as template
    assertFile(`${tmpDir}/boilerplate/README.md`, 'name = {{ name }}');
    assertFile(`${tmpDir}/boilerplate/.abc`, 'description = {{ description }}');
  });
});
