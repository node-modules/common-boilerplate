'use strict';

const Command = require('common-bin');
const assert = require('assert');
const path = require('path');
const isTextOrBinary = require('istextorbinary');
const globby = require('globby');
const { fs } = require('mz');
const { mkdirp } = require('mz-modules');
const inquirer = require('inquirer');
const runscript = require('runscript');
const Logger = require('./logger');
const parseGitUrl = require('git-url-parse');
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

    // define context.locals -> this.locals
    Object.defineProperties(this, {
      baseDir: {
        configurable: true,
        enumerable: true,
        get() { return this.context.argv.baseDir; },
      },
      locals: {
        configurable: true,
        enumerable: true,
        get() { return this.context.locals; },
      },
    });

    this.logger = this.initLogger();
    this.prompt = this.initInquirer();

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
    this.options = this._options = this.initOptions();

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
      verbose: {
        type: 'boolean',
        description: 'run at verbose mode, will print debug log',
        default: false,
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
    const { argv, cwd } = context;

    let baseDir = argv.baseDir || argv._[0] || cwd;
    if (!path.isAbsolute(baseDir)) baseDir = path.join(cwd, baseDir);
    argv.baseDir = baseDir;

    context.locals = {};

    return context;
  }

  async run() {
    // start
    this.logger.info(`run \`${this.pkgInfo.name}\` to ${this.baseDir}`);

    // ask user for input
    Object.assign(this.locals, await this.initLocals());
    this.questions = this.initQuestions();
    await this.askQuestions();

    this.logger.debug('locals: %j', this.locals);

    // find all boilerplate files
    const files = await this.listFiles();

    this.logger.debug(`total files: ${Object.keys(files).length}`);

    for (const key of Object.keys(files)) {
      const fileInfo = files[key];
      if (!fileInfo) continue;

      this.logger.debug(`file: ${fileInfo.src}`);

      await this.normalizeFileInfo({ fileInfo });
      await this.loadFile({ fileInfo });
      // process file, such as template render or replace string @ali/mm
      await this.processFile({ fileInfo, files });
      // save files to disk
      await this.saveFile({ fileInfo, files });
    }

    await this.npmInstall();

    await this.runTest();

    this.logger.info(`finish: ${this.baseDir}`);
  }

  async initLocals() {
    // node version, npm cli, npm registry, version, license
    const locals = {};
    locals.repository = await this.helper.exec('git config remote.origin.url');
    const gitInfo = parseGitUrl(locals.repository);
    locals.org = gitInfo.owner;
    locals.name = gitInfo.name;
    locals.user = await this.helper.exec('git config user.name');
    locals.email = await this.helper.exec('git config user.email');
    locals.author = `${locals.user} <${locals.email}>`;
    locals.npm = 'npm';

    // copy from argv
    const { argv } = this.context;
    for (const key of Object.keys(argv)) {
      if (key === '_' || key === '$0' || key === 'verbose') continue;
      if (argv[key] === undefined) continue;

      locals[key] = argv[key];
    }
    return locals;
  }

  initQuestions() {
    return [];
  }

  async askQuestions() {
    if (!this.questions.length) return;

    this.logger.info(`need to answer ${this.questions.length} questions`);

    // fill questions which had pass from argv
    const questions = this.questions.filter(q => {
      const item = this.context.argv[q.name];
      if (item === undefined) return true;
      this.logger.debug(`skip question due to argv \`--${q.name}=${item}\``);
      return false;
    });

    const answers = await this.prompt(questions);
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
   *
   * @param {Object} args - args
   * @param {String} [args.unit] - boilerpate dir name, default to `boilerplate`
   * @param {String} [args.pattern] - glob pattern, default to `** / *`
   * @return {Object<string, FileInfo>} all boilerplate files
   */
  async listFiles({ unit, pattern } = {}) {
    const result = [];
    for (const dir of this.boilerplatePaths) {
      const root = path.join(dir, unit || 'boilerplate');
      const files = await globby(pattern || '**/*', { cwd: root, dot: true, nodir: true });
      this.logger.debug(`list files from: ${root} and found ${files.length} entries`);

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
   *
   * @param {Object} args - args
   * @param {FileInfo} args.fileInfo - file info
   */
  async normalizeFileInfo({ fileInfo }) {
    // convert speical file name, such as `_package.json`, `{{ name }}.test.js`
    const fileName = await this.renderTemplate(fileInfo.key, this.locals);
    fileInfo.dest = path.join(this.baseDir, fileName);
  }

  /**
   * load file content to `fileInfo.content` and detect `fileInfo.isText`
   *
   * @param {Object} args - args
   * @param {FileInfo} args.fileInfo - file info
   */
  async loadFile({ fileInfo }) {
    fileInfo.content = await fs.readFile(fileInfo.src);
    fileInfo.isText = isTextOrBinary.isTextSync(fileInfo.fileName, fileInfo.content);
  }

  /**
   * do what you want to process file, such as render template
   *
   * @param {Object} args - args
   * @param {FileInfo} args.fileInfo - file info
   * @param {FileInfo[]} args.files - files list
   */
  async processFile({ fileInfo }) {
    const { key, isText } = fileInfo;
    // TODO: log progress
    // console.log(fileInfo.dest, isText);
    if (isText) {
      fileInfo.content = await this.renderTemplate(fileInfo.content, this.locals);
      if (key === 'package.json') {
        const pkg = await this.updatePkg(JSON.parse(fileInfo.content));
        fileInfo.content = JSON.stringify(pkg, null, 2);
      }
    }
  }

  /**
   * update your package info meta and devDependencies
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
    // may not publish yet, so will fail at npm install
    if (!process.env.TEST_UTILS_CLI) {
      pkg.devDependencies = pkg.devDependencies || {};
      pkg.devDependencies[this.pkgInfo.name] = `^${this.pkgInfo.version}`;
    }
    return pkg;
  }

  /**
   * save file to `fileInfo.dest`
   *
   * @param {FileInfo} args.fileInfo - file info
   * @param {FileInfo[]} args.files - files list
   * @param {FileInfo} fileInfo - file info
   */
  async saveFile({ fileInfo }) {
    await mkdirp(path.dirname(fileInfo.dest));
    await fs.writeFile(fileInfo.dest, fileInfo.content);
    this.logger.debug(`saved: ${fileInfo.dest}`);
  }

  /**
   * npm install
   *
   * will use `locals.npm` as cli
   */
  async npmInstall() {
    const argv = this.helper.unparseArgv({
      registry: this.locals.registry,
      'no-package-lock': true,
    });
    const cmd = `${this.locals.npm} install ${argv}`;
    this.logger.info(cmd);
    await runscript(cmd, { cwd: this.baseDir });
  }

  /**
   * run unit test
   */
  async runTest() {
    const cmd = `${this.locals.npm} test`;
    this.logger.info(cmd);
    await runscript(cmd, { cwd: this.baseDir });
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
    return tpl.toString().replace(/(\\)?{{\s*(\w+)\s*}}/g, (block, skip, key) => {
      if (skip) {
        return block.substring(skip.length);
      }
      return locals.hasOwnProperty(key) ? locals[key] : '';
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
   * create a signale logger, https://github.com/klauscfhq/signale
   * @return {Object} signale logger
   * @protected
   */
  initLogger() {
    const logger = new Logger({
      scope: 'Boilerplate',
    });

    logger.config({
      displayLabel: false,
      displayBadge: false,
    });

    // DEBUG=boilerplate
    if (!this.context.argv.verbose) logger.disable('debug');

    return logger;
  }

  /**
   * create a self contained inquirer module, and emit event
   * @return {Function} prompt
   * @private
   */
  initInquirer() {
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
          process.send && process.send({ type: 'prompt', name: this.opt.name });
          process.emit('message', { type: 'prompt', name: this.opt.name });
          return super.run();
        }
      };
    }
    return promptInstance;
  }
}

module.exports = BaseBoilerplate;
module.exports.testUtils = testUtils;
