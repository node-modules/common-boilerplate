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
    this.locals = {};

    this.prompt = this._initInquirer();

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
    const answers = await this.askQuestions();
    this.locals = Object.assign(this.locals, answers);

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

  async askQuestions() {
    // TODO: get user info
    // support silent
    if (!this.questions) return {};

    // for (const name of Object.keys(this.questions)) {
    //   const item = this.questions[name];
    //   if (item.silent) {
    //     this.locals[name] = item.default;
    //   }
    // }

    return this.prompt(this.questions);
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
    const { key, isText, content } = fileInfo;
    // TODO: log progress
    // console.log(fileInfo.dest, isText);
    if (isText) {
      fileInfo.content = await this.renderTemplate(content, context.locals);
      if (key === 'package.json') {
        const pkg = await this.updateMeta(JSON.parse(content));
        fileInfo.content = JSON.stringify(pkg, null, 2);
      }
    }
  }

  async updateMeta(pkg) {
    pkg.boilerplate = {
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
   * create a self contained inquirer module, and trigger event
   * @return {Function} prompt
   * @private
   */
  _initInquirer() {
    const originPrompt = inquirer.createPromptModule();
    const prompt = (questions, cb) => {
      if (!Array.isArray(questions)) questions = [].concat(questions);

      const task = originPrompt(questions, cb);
      let sendCount = 0;

      // will trigger after each prompt result
      task.ui.process.subscribe(() => {
        // only auto answer if current questions list is not finish
        if (sendCount < questions.length) {
          process.send({ type: 'prompt' });
          sendCount++;
        }
      });

      // send first key
      process.send({ type: 'prompt' });
      sendCount++;

      return task;
    };
    return prompt;
  }

  isTextFile(fileName) {
    return isTextPath(fileName) || path.basename(fileName).startsWith('.');
  }
}

module.exports = BaseBoilerplate;
