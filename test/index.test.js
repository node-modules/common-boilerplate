'use strict';

const path = require('path');
const assert = require('assert');
const is = require('is-type-of');
const { fs } = require('mz');
const { rimraf, mkdirp } = require('mz-modules');
const coffee = require('./utils');
const KEYS = coffee.KEYS;

describe('test/index.test.js', () => {
  const cwd = path.join(__dirname, '.tmp');
  let fileCache = {};

  function getFile(filePath) {
    filePath = path.join(cwd, filePath);
    if (!fileCache[filePath]) {
      fileCache[filePath] = fs.readFileSync(filePath, 'utf-8');
    }
    return fileCache[filePath];
  }

  function checkFileExists(filePath, exists) {
    exists = exists !== false;
    filePath = path.join(cwd, filePath);
    assert(fs.existsSync(filePath) === exists);
  }

  function assertFile(filePath, str) {
    if (is.string(str)) {
      assert(getFile(filePath).includes(str));
    } else {
      assert(getFile(filePath).match(str));
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
    await coffee.fork(path.join(__dirname, 'fixtures/normal/bin/cli.js'), [ ], { cwd })
      .debug()
      .waitForPrompt()
      .write('example\n')
      .write('this is a desc\n')
      .write('\n')
      .write('\n')
      .write(KEYS.DOWN + KEYS.DOWN + KEYS.UP + '\n')
      .end();

    const pkg = JSON.parse(getFile('package.json'));
    assert(pkg.boilerplate.name === 'normal');
    assert(pkg.boilerplate.version === '1.0.0');
    assert(pkg.name === 'example');
    assert(pkg.description === 'this is a desc');

    assertFile('README.md', 'name = example');
    assertFile('README.md', 'description = this is a desc');
    assertFile('README.md', 'type = plugin');
    assertFile('README.md', 'empty = {{ empty }}');
    assertFile('README.md', 'escapse = {{ name }}');
    assertFile('test/example.test.js', 'const mock = require(\'egg-mock\');');

    checkFileExists('test/example.test.js');
    checkFileExists('.gitignore');
    checkFileExists('.eslintrc');
    checkFileExists('github.png');
  });

  it('should support multi-level boilerplate', async () => {
    await coffee.fork(path.join(__dirname, 'fixtures/multi-level/bin/cli.js'), [ ], { cwd })
      .debug()
      .waitForPrompt()
      .write('example\n')
      .write('this is a desc\n')
      .write('\n')
      .write('\n')
      .write(KEYS.DOWN + KEYS.DOWN + '\n')
      .write('ANOTHER\n')
      .expect('code', 0)
      .end();

    const pkg = JSON.parse(getFile('package.json'));
    assert(pkg.boilerplate.name === 'multi-level');
    assert(pkg.boilerplate.version === '1.0.0');
    assert(pkg.author === 'egg');

    // override file
    assertFile('README.md', 'name = example');
    assertFile('README.md', 'another = ANOTHER');

    checkFileExists('test/example.test.js');
    assertFile('test/example.test.js', 'const mock = require(\'@ali/mm\');');

    // new file
    checkFileExists('index.json');
    // remove file
    checkFileExists('github.png', false);
  });

  it('should support mutli prompt', async () => {
    await coffee.fork(path.join(__dirname, 'fixtures/mutli-prompt/bin/cli.js'), [ ], { cwd })
      .debug()
      .waitForPrompt()
      .write('example\n')
      .write('this is a desc\n')
      .write(KEYS.DOWN + KEYS.DOWN + KEYS.UP + '\n')
      .expect('code', 0)
      .end();

    assertFile('README.md', 'name = example');
    assertFile('README.md', 'description = this is a desc');
    assertFile('README.md', 'type = plugin');
    assertFile('README.md', 'empty = {{ empty }}');
    assertFile('README.md', 'escapse = {{ name }}');
  });

  describe('argv', () => {
    it('--baseDir', async () => {
      await coffee.fork(path.join(__dirname, 'fixtures/argv/bin/cli.js'), [ '--baseDir', '.tmp' ], { cwd: path.dirname(cwd) })
        // .debug()
        .expect('stdout', /one context: true/)
        .end();

      assertFile('README.md', `baseDir = ${cwd}`);
    });

    it('--baseDir absolute', async () => {
      await coffee.fork(path.join(__dirname, 'fixtures/argv/bin/cli.js'), [ '--baseDir', cwd ], { cwd: path.dirname(cwd) })
        // .debug()
        .end();

      assertFile('README.md', `baseDir = ${cwd}`);
    });

    it('argv._[0]', async () => {
      await coffee.fork(path.join(__dirname, 'fixtures/argv/bin/cli.js'), [ cwd ])
        // .debug()
        .end();

      assertFile('README.md', `baseDir = ${cwd}`);
    });
  });
});
