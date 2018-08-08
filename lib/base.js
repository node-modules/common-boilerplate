'use strict';

const Command = require('common-bin');
const assert = require('assert');
const path = require('path');
const isTextPath = require('is-text-path');
const globby = require('globby');
const { fs } = require('mz');
const { mkdirp } = require('mz-modules');
const inquirer = require('inquirer');
const parseGitUrl = require('git-url-parse');
const debug = require('debug')('boilerplate:base');
const CONTEXT = Symbol('context');
const KEY = 'boilerplate#root';
const helper = require('./helper');
const testUtils = require('./test_utils');

class BaseBoilerplate extends Command {
  constructor(rawArgv) {
    super(rawArgv);

    this.boilerplatePaths = this._getBoilerplatePaths();
    const currentPath = this.boilerplatePaths[this.boilerplatePaths.length - 1];
    this.pkgInfo = require(path.join(currentPath, 'package.json'));

    this.locals = {};

    this.prompt = this._initInquirer();
    this.questions = this.initQuestions();

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

    Object.assign(this.helper, helper);

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
      auto: {
        type: 'boolean',
        description: 'whether auto answer question with argv && default',
      },
    };
  }

  get context() {
    if (!this[CONTEXT]) {
      this[CONTEXT] = this.initContext(super.context);
    }
    return this[CONTEXT];
  }

  initContext(context) {
    // TODO: merge from package.json and ~/.eggrc
    const { argv, cwd } = context;
    const self = this;

    let baseDir = argv.baseDir || argv._[0] || cwd;
    if (!path.isAbsolute(baseDir)) baseDir = path.join(cwd, baseDir);
    argv.baseDir = baseDir;

    // define context.locals -> this.locals
    Object.defineProperty(context, 'locals', {
      configurable: true,
      enumerable: true,
      get() { return self.locals; },
    });
    return context;
  }

  async run(context) {
    // ask user for input
    await this.initLocals();
    await this.askQuestions();

    debug('[boilerplate] locals: %j', this.locals);

    // find all boilerplate files
    const files = await this.listFiles();

    for (const key of Object.keys(files)) {
      const fileInfo = files[key];
      if (!fileInfo) continue;

      await this.normalizeFileInfo({ fileInfo, context });
      await this.loadFile({ fileInfo });
      // process file, such as template render or replace string @ali/mm
      await this.processFile({ fileInfo, context, files });
      // save files to disk
      await this.saveFile({ fileInfo, context, files });
    }
  }

  async initLocals() {
    // TODO: node version, npm cli, npm registry, version, license
    this.locals.repository = await this.helper.exec('git config remote.origin.url');
    const gitInfo = parseGitUrl(this.locals.repository);
    this.locals.org = gitInfo.owner;
    this.locals.name = gitInfo.name;
    this.locals.user = await this.helper.exec('git config user.name');
    this.locals.email = await this.helper.exec('git config user.email');

    return this.locals;
  }

  initQuestions() {
    return [
      {
        name: 'name',
        type: 'input',
        message: 'Project Name: ',
        default: () => this.locals.name,
      },
      {
        name: 'description',
        type: 'input',
        message: 'Description:',
      },
      {
        name: 'repository',
        type: 'input',
        message: 'Repository:',
        default: () => this.locals.repository,
      },
      {
        name: 'author',
        type: 'input',
        message: 'Author:',
        default: () => `${this.locals.user} <${this.locals.email}>`,
      },
    ];
  }

  async askQuestions() {
    // support silent
    if (!this.questions.length) return;

    const answers = await this.prompt(this.questions);
    Object.assign(this.locals, answers);
  }

  /**
   * @typedef FileInfo
   * @type {Object}
   * @property {String} key - file name
   * @property {String} src - source template full path
   * @property {String} dest - target path
   * @property {Boolean} isText - whether file type is textfile
   * @property {String|Buffer} content - file content
   */


  /**
   * find all boilerplate files from prototype chain
   * @return {Object<string, FileInfo>} all boilerplate files
   */
  async listFiles() {
    const result = {};
    for (const p of this.boilerplatePaths) {
      const root = path.join(p, 'boilerplate');
      const files = await globby('**/*', { cwd: root, dot: true, nodir: true });
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
   * @param {Object} args - args
   * @param {FileInfo} args.fileInfo - file info
   * @param {Object} args.context - context info
   */
  async normalizeFileInfo({ fileInfo, context }) {
    // convert speical file name, such as `_package.json`, `{{ name }}.test.js`
    const fileName = await this.renderTemplate(fileInfo.key, context.locals);
    fileInfo.isText = this.isTextFile(fileName);
    fileInfo.dest = path.join(context.argv.baseDir, fileName);
  }

  /**
   * load file content to `fileInfo.content`
   *
   * @param {Object} args - args
   * @param {FileInfo} args.fileInfo - file info
   */
  async loadFile({ fileInfo }) {
    fileInfo.content = await fs.readFile(fileInfo.src);
  }

  /**
   * do what you want to process file, such as render template
   *
   * @param {Object} args - args
   * @param {FileInfo} args.fileInfo - file info
   * @param {Object} args.context - context info
   * @param {FileInfo[]} args.files - files list
   */
  async processFile({ fileInfo, context }) {
    const { key, isText } = fileInfo;
    // TODO: log progress
    // console.log(fileInfo.dest, isText);
    if (isText) {
      fileInfo.content = await this.renderTemplate(fileInfo.content, context.locals);
      if (key === 'package.json') {
        const pkg = await this.updatePkg(JSON.parse(fileInfo.content));
        fileInfo.content = JSON.stringify(pkg, null, 2);
      }
    }
  }

  /**
   * update your package info meta
   *
   * @param {Object} pkg - package info
   * @return {Object} new package info
   */
  async updatePkg(pkg) {
    pkg.boilerplate = {
      __meta: 'DO NOT REMOVE THIS',
      name: this.pkgInfo.name,
      version: this.pkgInfo.version,
    };
    return pkg;
  }

  /**
   * save file to `fileInfo.dest`
   *
   * @param {FileInfo} args.fileInfo - file info
   * @param {Object} args.context - context info
   * @param {FileInfo[]} args.files - files list
   * @param {FileInfo} fileInfo - file info
   */
  async saveFile({ fileInfo }) {
    // console.log(`${fileInfo.src} -> ${fileInfo.dest}`);
    await mkdirp(path.dirname(fileInfo.dest));
    await fs.writeFile(fileInfo.dest, fileInfo.content);
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
  async renderTemplate(tpl, locals) {
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
      /* istanbul ignore else */
      if (!paths.includes(realpath)) {
        paths.unshift(realpath);
      }
    }

    return paths;
  }

  /**
   * create a self contained inquirer module, and emit event
   * @return {Function} prompt
   * @private
   */
  _initInquirer() {
    // create a self contained inquirer module.
    const promptInstance = inquirer.createPromptModule();
    const promptMapping = promptInstance.prompts;
    for (const key of Object.keys(promptMapping)) {
      const Clz = promptMapping[key];
      // extend origin prompt instance to emit event
      promptMapping[key] = class CustomPrompt extends Clz {
        /* istanbul ignore next */
        static get name() { return Clz.name; }
        run() {
          process.send({ type: 'prompt', name: this.opt.name });
          return super.run();
        }
      };
    }
    return promptInstance;
  }

  isTextFile(fileName) {
    return isTextPath(fileName) || path.basename(fileName).startsWith('.');
  }
}

module.exports = BaseBoilerplate;
module.exports.testUtils = testUtils;
