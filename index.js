'use strict';

const Command = require('common-bin');
const assert = require('assert');
const path = require('path');
const isTextPath = require('is-text-path');
const globby = require('globby');
const { fs } = require('mz');
const { mkdirp } = require('mz-modules');
const inquirer = require('inquirer');
const CONTEXT = Symbol('context');
const KEY = 'boilerplate#root';

class BaseBoilerplate extends Command {
  constructor(rawArgv) {
    super(rawArgv);

    this.boilerplatePaths = this._getBoilerplatePaths();
    const currentPath = this.boilerplatePaths[this.boilerplatePaths.length - 1];
    this.pkgInfo = require(path.join(currentPath, 'package.json'));

    this.inquirer = inquirer;

    this.fileMapping = {
      gitignore: '.gitignore',
      _gitignore: '.gitignore',
      '_.gitignore': '.gitignore',
      '_package.json': 'package.json',
      '_.eslintrc': '.eslintrc',
      '_.eslintignore': '.eslintignore',
      '_.npmignore': '.npmignore',
    };

    // it's a setter
    this.options = this.initOptions();

    this.parserOptions = {
      execArgv: true,
      removeAlias: true,
    };
  }

  initOptions() {
    return {
      baseDir: {
        description: 'directory of application, default to `process.cwd()`',
        type: 'string',
      },
      npm: {
        description: 'npm cli, npm/cnpm/tnpm/...',
        type: 'string',
      },
      registry: {
        type: 'string',
        description: 'npm registry, support china/npm/custom, default to auto detect',
        alias: 'r',
      },
    };
  }

  get context() {
    if (!this[CONTEXT]) {
      this[CONTEXT] = this.patchContext(super.context);
    }
    return this[CONTEXT];
  }

  patchContext(context) {
    // merge from package.json and ~/.eggrc
    return context;
  }

  * run(context) {
    const { argv, cwd } = context;
    /* istanbul ignore next */
    let baseDir = argv.baseDir || argv._[0] || cwd;
    /* istanbul ignore next */
    if (!path.isAbsolute(baseDir)) baseDir = path.join(cwd, baseDir);
    this.baseDir = baseDir;

    // ask user for input
    context.locals = yield this.prompt();

    // find all boilerplate files
    const files = yield this.listFiles();

    for (const key of Object.keys(files)) {
      const fileInfo = files[key];
      yield this.normalizeFileInfo(fileInfo, context.locals);
      yield this.loadFile(fileInfo);
      // process file, such as template render or replace string @ali/mm
      yield this.processFile(fileInfo, context.locals);
      // save files to disk
      yield this.saveFile(fileInfo);
      // console.log(fileInfo);
    }
  }

  * prompt() {
    // TODO: get user info
    // support silent
    return {};
  }

  /**
   * @typedef FileInfo
   * @type {Object}
   * @property {String} key
   * @property {String} src
   * @property {String} dest
   */


  /**
   * find all boilerplate files from prototype chain
   * @return {Object<string, FileInfo>} all boilerplate files
   */
  * listFiles() {
    const result = {};
    for (const p of this.boilerplatePaths) {
      const root = path.join(p, 'boilerplate');
      const files = yield globby('**/*', { cwd: root, dot: true, nodir: true });
      for (const file of files) {
        // convert speical file name, such as `_package.json`
        const key = this.fileMapping[file] || file;
        // will override
        result[key] = {
          key,
          src: path.join(root, file),
        };
      }
    }
    return result;
  }

  /**
   * normalize fileInfo
   *  - `fileInfo.dest`: convert speical file name, such as `{{ name }}.test.js`
   *  - `fileInfo.isText`
   *
   * @param {FileInfo} fileInfo - file info
   * @param {Object} locals - scope locals
   * @return {FileInfo} new file info
   */
  * normalizeFileInfo(fileInfo, locals) {
    // convert speical file name, such as `_package.json`, `{{ name }}.test.js`
    const filePath = this.renderTemplate(fileInfo.key, locals);
    fileInfo.isText = this.isTextFile(filePath);
    fileInfo.dest = path.join(this.baseDir, filePath);
    return fileInfo;
  }

  /**
   * load file content to `fileInfo.content`
   * @param {FileInfo} fileInfo - file info
   * @return {FileInfo} new file info
   */
  * loadFile(fileInfo) {
    fileInfo.content = yield fs.readFile(fileInfo.src);
    return fileInfo;
  }

  /**
   * do what you want to process file, such as render template
   *
   * @param {FileInfo} fileInfo - file info
   * @param {Object} locals - scope locals
   * @return {FileInfo} new file info
   */
  * processFile(fileInfo, locals) {
    if (fileInfo.isText) {
      fileInfo.content = this.renderTemplate(fileInfo.content, locals);
      if (fileInfo.key === 'package.json') {
        const pkg = yield this.updateMeta(JSON.parse(fileInfo.content));
        fileInfo.content = JSON.stringify(pkg, null, 2);
      }
    }
    return fileInfo;
  }

  * updateMeta(pkg) {
    pkg.boilerplate = {
      name: this.pkgInfo.name,
      version: this.pkgInfo.version,
    };
    return pkg;
  }

  /**
   * save file to `fileInfo.dest`
   * @param {FileInfo} fileInfo - file info
   */
  * saveFile(fileInfo) {
    yield mkdirp(path.dirname(fileInfo.dest));
    yield fs.writeFile(fileInfo.dest, fileInfo.content);
  }

  /**
   * render template with locals
   *
   * - `{{ test }}` will replace
   * - `\{{ test }}` will skip
   *
   * @param {String} tpl - template content
   * @param {Object} locals - variable scope
   * @return {String} new content
   */
  renderTemplate(tpl, locals) {
    return tpl.toString().replace(/(\\)?{{ *(\w+) *}}/g, (block, skip, key) => {
      if (skip) {
        return block.substring(skip.length);
      }
      return locals.hasOwnProperty(key) ? locals[key] : block;
    });
  }

  /**
   * get boilerplate directories from prototype chain
   * @return {Array<String>} paths
   * @private
   */
  _getBoilerplatePaths() {
    // avoid require recursively
    const paths = [];

    let proto = this;

    // Loop for the prototype chain
    while (proto) {
      proto = Object.getPrototypeOf(proto);
      // stop the loop if
      // - object extends Object
      // - object extends BaseBoilerplate
      if (proto === Object.prototype || proto === BaseBoilerplate.prototype) {
        break;
      }

      const rootPath = proto[Symbol.for(KEY)];
      assert(proto.hasOwnProperty(Symbol.for(KEY)), `Symbol.for('${KEY}') is required on Boilerplate`);
      assert(rootPath && typeof rootPath === 'string', `Symbol.for('${KEY}') should be string`);
      assert(fs.existsSync(rootPath), `${rootPath} not exists`);
      const realpath = fs.realpathSync(rootPath);
      if (!paths.includes(realpath)) {
        paths.unshift(realpath);
      }
    }

    return paths;
  }

  isTextFile(filePath) {
    return isTextPath(filePath) || path.basename(filePath).startsWith('.');
  }
}

module.exports = BaseBoilerplate;

module.exports.testUtils = require('./lib/test_utils');
