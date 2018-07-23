'use strict';

const path = require('path');
const assert = require('assert');
const is = require('is-type-of');
const { fs } = require('mz');
const { rimraf, mkdirp } = require('mz-modules');
const { fork, KEYS } = require('./utils');

describe('test/index.test.js', () => {
  const cwd = path.join(__dirname, '.tmp');
  let fileCache = {};

  function assertFile(filePath, str) {
    filePath = path.join(cwd, filePath);
    if (!fileCache[filePath]) {
      fileCache[filePath] = fs.readFileSync(filePath, 'utf-8');
    }
    const content = fileCache[filePath];
    if (is.string(str)) {
      assert(content.includes(str));
    } else {
      assert(content.match(str));
    }
  }

  beforeEach(async () => {
    await rimraf(cwd);
    await mkdirp(cwd);
  });

  afterEach(async () => {
    // await rimraf(cwd);
    fileCache = {};
  });

  it('should work', async () => {
    await fork(path.join(__dirname, 'fixtures/normal/bin/cli.js'), [ ], { cwd })
      // .debug()
      .waitForPrompt()
      .write('example\n')
      .write('this is a desc\n')
      .end();
  });

  it('should boilerplate for boilerplate', async () => {
    await fork(path.join(__dirname, 'fixtures/boilerplate-boilerplate/bin/cli.js'), [ ], { cwd })
      // .debug()
      .waitForPrompt()
      .write('example\n')
      .write('this is a desc\n')
      .end();
  });

  it('should support mutli prompt', async () => {
    await fork(path.join(__dirname, 'fixtures/mutli-prompt/bin/cli.js'), [ ], { cwd })
      // .debug()
      .waitForPrompt()
      .write('example\n')
      .write('this is a desc\n')
      .write(KEYS.DOWN + KEYS.DOWN + KEYS.UP + '\n')
      .end();

    assertFile('README.md', 'name = example');
    assertFile('README.md', 'description = this is a desc');
    assertFile('README.md', 'type = plugin');
    assertFile('README.md', 'empty = {{ empty }}');
    assertFile('README.md', 'escapse = {{ name }}');
  });
});
