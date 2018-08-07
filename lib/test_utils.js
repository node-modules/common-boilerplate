'use strict';

const { Coffee } = require('coffee');
const path = require('path');
const is = require('is-type-of');
const { rimraf, mkdirp } = require('mz-modules');
const debug = require('debug')('boilerplate:testUtils');
const FileRule = require('./rule_file');
const JSONRule = require('./rule_json');
const KEYS = {
  UP: '\u001b[A',
  DOWN: '\u001b[B',
  LEFT: '\u001b[D',
  RIGHT: '\u001b[C',
  ENTER: '\n',
  SPACE: ' ',
};

class CliCoffee extends Coffee {
  constructor(options) {
    options = formatOptions(options);
    super(options);
    this.options = options;
    this.baseDir = options.baseDir;

    rimraf.sync(this.options.tmpDir);
    mkdirp.sync(this.options.tmpDir);

    this.setRule('file', FileRule);
    this.setRule('json', JSONRule);

    // prompt mode as default
    this.waitForPrompt();
  }

  choose(n) {
    this.write(KEYS.DOWN.repeat(n) + KEYS.ENTER);
    return this;
  }

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

  expectJSON(file, pattern) {
    if (!path.isAbsolute(file)) file = path.join(this.options.tmpDir, file);
    this._addAssertion({
      type: 'json',
      expected: {
        file,
        pattern,
      },
    });
    return this;
  }

  notExpectJSON(file, pattern) {
    if (!path.isAbsolute(file)) file = path.join(this.options.tmpDir, file);
    this._addAssertion({
      type: 'json',
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
    this.json = {};
    return ret;
  }

  /**
   * kill the process
   */
  close() {
    if (this.options.clean) {
      rimraf.sync(this.options.tmpDir);
    }

    const proc = this.proc;
    if (proc.connected) {
      proc.kill('SIGTERM');
    }
  }

  end() {
    return super.end()
      .then(() => this.close())
      .catch(err => {
        this.close();
        throw err;
      });
  }
}

function formatOptions(options) {
  // support `testUtils.run('app')`
  if (is.string(options)) options = { baseDir: options };

  const defaults = {
    method: 'fork',
    baseDir: process.cwd(),
    tmpDir: path.join(process.cwd(), 'test/.tmp'),
    coverage: true,
    clean: true,
  };
  options = Object.assign({}, defaults, options);

  // relative path to test/fixtures, `formatOptions({ baseDir: 'app' })` => `$PWD/test/fixtures/app`
  if (!path.isAbsolute(options.baseDir)) {
    options.baseDir = path.join(process.cwd(), 'test/fixtures', options.baseDir);
  }

  options.cmd = options.cmd || path.join(options.baseDir, 'bin/cli.js');
  options.clean = options.clean !== false;
  options.opt = options.opt || {};
  options.opt.cwd = options.opt.cwd || options.tmpDir;

  debug('format options: %j', options);
  return options;
}


exports.run = options => {
  return new CliCoffee(options);
};

exports.Coffee = Coffee;
exports.FileRule = FileRule;
exports.JSONRule = JSONRule;
exports.KEYS = KEYS;
