'use strict';

const path = require('path');
const assert = require('assert');
const is = require('is-type-of');
const { fs } = require('mz');
const { rimraf, mkdirp } = require('mz-modules');
const { fork, KEYS } = require('../').testUtils;

describe('test/index.test.js', () => {
  const cwd = path.join(__dirname, '.tmp');
  let fileCache = {};

  function assertFile(filePath, str) {
    filePath = path.join(cwd,filePath);
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

  beforeEach(function* () {
    yield rimraf(cwd);
    yield mkdirp(cwd);
  });

  afterEach(function* () {
    // yield rimraf(cwd);
    fileCache = {};
  });

  it('should work', function* () {
    yield fork(path.join(__dirname, 'fixtures/normal/bin/cli.js'), [ ], { cwd })
      .debug()
      .mockPrompt('example')
      .mockPrompt('this is a desc')
      .end();
  });

  it('should test-utils', function* () {
    yield fork(path.join(__dirname, 'fixtures/test-utils/bin/cli.js'), [ ], { cwd })
      .debug()
      .mockPrompt('example')
      .mockPrompt('this is a desc')
      .mockPrompt(KEYS.DOWN + KEYS.DOWN + KEYS.UP)
      .end();

    assertFile('README.md', 'name = example');
    assertFile('README.md', 'description = this is a desc');
    assertFile('README.md', 'type = plugin');
  });
});
