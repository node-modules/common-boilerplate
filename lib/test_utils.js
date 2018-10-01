'use strict';

const { Coffee } = require('coffee');
const path = require('path');
const is = require('is-type-of');
const fs = require('fs');
const assert = require('assert');
const { rimraf, mkdirp } = require('mz-modules');
const FileRule = require('./rule_file');

const KEYS = {
  UP: '\u001b[A',
  DOWN: '\u001b[B',
  LEFT: '\u001b[D',
  RIGHT: '\u001b[C',
  ENTER: '\n',
  SPACE: ' ',
};

class CliCoffee extends Coffee {
  /**
   * Coffee for cli
   *
   * @param {Object} options - args below and all opts from Coffee
   * @param {String} options.baseDir - cli base dir, support relative path
   */
  constructor(options) {
    super(options);
    this.options = options;
    this.baseDir = options.baseDir;

    rimraf.sync(this.options.tmpDir);
    mkdirp.sync(this.options.tmpDir);

    this.setRule('file', FileRule);

    // prompt mode as default
    this.waitForPrompt();

    this.once('close', () => {
      if (this.stdin.length !== 0) {
        console.warn(`stdin is not empty, write() too much? left with ${JSON.stringify(this.stdin)}`);
      }
    });
  }

  /**
   * trigger `DOWN` key to choose list
   *
   * @param {Number} n - count
   * @return {Coffee} return self for chain
   */
  choose(n) {
    this.write(KEYS.DOWN.repeat(n) + KEYS.ENTER);
    return this;
  }

  /**
   * assert file
   *
   * @param {String} file - file path, support relative path
   * @param {String|RegExp|Object|Array} [pattern] - test rule
   *  - {undefined} will only check whether file is exists
   *  - {String} will check with `includes`
   *  - {RegExp} will check with regex
   *  - {Object} will check whether contains json
   *  - {Array} support all above
   * @return {Coffee} return self for chain
   *
   * ```js
   * expectFile('README.md')
   * expectFile('README.md', 'this is a desc')
   * expectFile('README.md', /desc/)
   * expectFile('package.json', { name: 'example' })
   * expectFile('README.md', [ 'this is a desc', /desc/ ])
   * ```
   */
  expectFile(file, pattern) {
    // TODO: fix error stack
    if (!path.isAbsolute(file)) file = path.join(this.options.tmpDir, file);

    this._addAssertion({
      type: 'file',
      expected: {
        file,
        pattern,
      },
    });
    return this;
  }

  /**
   * Assert type with not expected value, opposite assertion of `expectFile`.
   *
   * Note: `notExpectFile('README.md', /desc/)` will not pass if `README.md` is not exists
   *
   * @param {String} file - file path, support relative path
   * @param {String|RegExp|Object|Array} [pattern] - test rule
   * @return {Coffee} return self for chain
   */
  notExpectFile(file, pattern) {
    if (!path.isAbsolute(file)) file = path.join(this.options.tmpDir, file);
    this._addAssertion({
      type: 'file',
      expected: {
        file,
        pattern,
      },
      isOpposite: true,
    });
    return this;
  }

  restore() {
    const ret = super.restore();
    this.file = {};
    return ret;
  }

  end(cb) {
    /* istanbul ignore next */
    if (cb) return super.end(cb);

    // add self to return at promise mode
    return super.end()
      .then(result => {
        result.cli = this;
        return result;
      });
  }
}

function formatOptions(options) {
  const defaults = {
    method: 'fork',
    baseDir: process.cwd(),
    tmpDir: path.join(process.cwd(), 'test/.tmp'),
    coverage: true,
  };
  options = Object.assign({}, defaults, options);

  // relative path to test/fixtures, `formatOptions({ baseDir: 'app' })` => `$PWD/test/fixtures/app`
  if (!path.isAbsolute(options.baseDir)) {
    options.baseDir = path.join(process.cwd(), 'test/fixtures', options.baseDir);
  }

  options.cmd = options.cmd || path.join(__dirname, 'start_cli.js');
  options.opt = options.opt || {};
  options.opt.cwd = options.opt.cwd || options.tmpDir;
  options.opt.env = options.opt.env || Object.assign({}, process.env);
  options.opt.env.TEST_UTILS_CLI = options.baseDir;

  assert(fs.existsSync(options.cmd), `${options.cmd} not exists`);
  return options;
}


/**
 * run cli test
 *
 * ```js
 * await testUtils.run()
 *   .write('example\n')
 *   .expectFile('README.md', 'this is desc')
 *   .expectFile('package.json', { name: 'example' })
 *   .end();
 * ```
 *
 * @param {String} [baseDir] - cli base dir, support relative path, default to `process.cwd()`
 * @param {Object} [options] - coffee options
 * @return {CliCoffee} return coffee instance
 */
exports.run = (baseDir, options) => {
  // support `testUtils.run('app')`
  if (is.string(baseDir)) {
    options = Object.assign({ baseDir }, options);
  } else {
    options = baseDir;
  }
  options = formatOptions(options);

  return new CliCoffee(options);
};

exports.Coffee = CliCoffee;
exports.FileRule = FileRule;
exports.KEYS = KEYS;
