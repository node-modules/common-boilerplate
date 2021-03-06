'use strict';

const Command = require('common-bin-plus');
const assert = require('assert');
const path = require('path');
const extend = require('extend2');
const { isText } = require('istextorbinary');
const globby = require('globby');
const { fs } = require('mz');
const { mkdirp } = require('mz-modules');
const nunjucks = require('nunjucks');
const micromatch = require('micromatch');
const { HttpClient2 } = require('urllib');

const KEY = 'boilerplate#root';
const BOILERPLATE_PATHS = 'boilerplate#paths';
const helper = require('./helper');

class BaseBoilerplate extends Command {
  constructor(rawArgv) {
    super(rawArgv);

    this.cliName = 'Boilerplate';

    this.fileMapping = {
      gitignore: '.gitignore',
      _gitignore: '.gitignore',
      '_.gitignore': '.gitignore',
      '_package.json': 'package.json',
      '_.eslintrc': '.eslintrc',
      '_.eslintignore': '.eslintignore',
      '_.npmignore': '.npmignore',
    };

    // use nunjucks as render engine
    this.renderEngine = nunjucks;
    this.renderEngine.configure({ autoescape: false });
    this.templateRules = [ '**' ];

    this.requestOpts = {
      method: 'GET',
      // contentType: 'json',
      // dataType: 'json',
      // gzip: true,

      retry: 1,
      retryDelay: 50,
      followRedirect: true,
      maxRedirects: 3,

      // proxy
      rejectUnauthorized: !process.env.http_proxy,
      enableProxy: !!process.env.http_proxy,
      proxy: process.env.http_proxy,
    };

    this.httpclient = new HttpClient2();

    Object.assign(this.helper, helper);
  }

  initOptions() {
    return Object.assign(super.initOptions(), {
      baseDir: {
        description: 'directory of application, default to `process.cwd()`',
        type: 'string',
      },
      npm: {
        description: 'npm cli, tnpm/cnpm/npm, will auto guess',
        type: 'string',
      },
      registry: {
        type: 'string',
        description: 'npm registry, support china/npm/custom, default to auto detect',
        alias: 'r',
      },
      force: {
        type: 'boolean',
        description: 'force to override directory',
        alias: 'f',
      },
    });
  }

  initContext(context) {
    const { argv, cwd } = context;

    let baseDir = argv.baseDir || argv._[0] || cwd;
    if (!path.isAbsolute(baseDir)) baseDir = path.join(cwd, baseDir);
    argv.baseDir = baseDir;

    context.locals = {};

    return context;
  }

  get baseDir() {
    return this.context.argv.baseDir;
  }

  get locals() {
    return this.context.locals;
  }

  get pkgInfo() {
    const currentPath = this.boilerplatePaths[this.boilerplatePaths.length - 1] || /* istanbul ignore next */ path.dirname(__dirname);
    return require(path.join(currentPath, 'package.json'));
  }

  async run() {
    // start
    this.logger.info(`start init by \`${this.pkgInfo.name}\``);

    // collect locals
    Object.assign(this.locals, await this.initLocals());

    // check target dir
    await this.checkTargetDirectory();

    // ask user for input
    await this.askQuestions();

    this.logger.debug('locals: %j', this.locals);

    // find all boilerplate files
    const files = await this.listFiles({ loadUnits: this.boilerplatePaths });
    this.templateMatcher = micromatch.matcher(this.templateRules, { dot: true });

    this.logger.info(`copy to ${this.baseDir}, total files: ${Object.keys(files).length}`);

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

    await this.doPostJob();

    this.logger.success('finish generate job, enjoy yourself.');
  }

  async initLocals() {
    // node version, npm cli, npm registry, version, license
    const user = await this.helper.execForResult('git config user.name');
    const email = await this.helper.execForResult('git config user.email');
    const repository = await this.helper.execForResult('git config remote.origin.url');
    const gitInfo = repository && this.helper.parseGitUrl(repository);

    const locals = {
      name: gitInfo && gitInfo.name || path.basename(this.baseDir),
      repository: gitInfo && gitInfo.full_name,
      user: {
        name: user,
        email,
        author: user && `${user} <${email}>`,
      },
      gitInfo,
    };

    // extract from argv
    const { argv } = this.context;
    const argvObj = {};
    for (const key of Object.keys(argv)) {
      if (key === '_' || key === '$0' || key === 'verbose') continue;
      if (argv[key] === undefined) continue;

      argvObj[key] = argv[key];
    }

    // deep merge
    extend(true, locals, argvObj);

    // guess npm cli
    if (!locals.npm) {
      for (const cli of [ 'tnpm', 'cnpm', 'npm' ]) {
        const stdout = await this.helper.execForResult(`${cli} config get registry`);
        if (stdout.length > 0) {
          locals.npm = cli;
          if (!locals.registry) locals.registry = stdout;
          break;
        }
      }
    }

    // normalize npm registry url, only if `registry` is pass
    let registry = locals.registry;
    if (registry) {
      switch (registry) {
        case 'china': {
          registry = 'https://registry.nlark.com';
          break;
        }

        case 'npm': {
          registry = 'https://registry.npmjs.org';
          break;
        }

        default: {
          registry = registry.replace(/\/$/, '');
        }
      }
      locals.registry = registry;
    }

    return locals;
  }

  setLocals(obj) {
    extend(true, this.locals, obj);
  }

  async checkTargetDirectory() {
    // check if directory exists
    await mkdirp(this.baseDir);

    // check if directory empty
    const files = await fs.readdir(this.baseDir);
    const isNotEmpty = files.some(name => !name.startsWith('.'));

    if (isNotEmpty) {
      if (this.locals.force) {
        this.logger.warn(`${this.baseDir} it not empty and will be override due to --force`);
      } else {
        throw new Error(`${this.baseDir} it not empty, use --force to override.`);
      }
    }
  }

  async askQuestions() {
    // template method
  }

  async doPostJob() {
    // template method
  }

  /**
   * ask use for npm questions, including `scope` / `name` / `description`, and `pkgName` getter
   * @param {Object} [opts] - { prefix } for npm name, such as `create-`
   * @return {Object} answsers
   */
  async askNpm(opts) {
    const prefix = opts && opts.prefix || '';

    const { scope } = await this.prompt({
      name: 'scope',
      type: 'input',
      message: 'NPM Scope: ',
      filter: v => {
        if (v && !v.startsWith('@')) {
          v = '@' + v;
        }
        return v;
      },
    });

    const { name } = await this.prompt({
      name: 'name',
      type: 'input',
      message: 'NPM Name: ',
      default: () => `${prefix}${this.locals.name}`,
      validate: v => !!v,
      filter(v) {
        if (v && prefix && !v.startsWith(prefix)) {
          v = `${prefix}${v}`;
        }
        return v;
      },
      transformer(v) {
        return !prefix || v.startsWith(prefix) ? v : `${prefix}${v}`;
      },
    });

    const { description } = await this.prompt({
      name: 'description',
      type: 'input',
      message: 'Description:',
    });

    const answers = {
      name,
      scope,
      pkgName: scope ? `${scope}/${name}` : name,
      description,
    };

    this.setLocals(answers);
    return answers;
  }

  /**
   * ask use for git repository questions, and will update `homepage` and `gitInfo`
   *
   * @return {Object} answsers
   */
  async askGit() {
    const { repository } = await this.prompt({
      name: 'repository',
      type: 'input',
      message: 'Repository(owner/repo): ',
      default: () => {
        const { pkgName, repository } = this.locals;
        if (repository) return repository;
        if (pkgName.startsWith('@')) return pkgName.substring(1);
      },
    });

    const gitInfo = helper.hostedGitInfo.fromUrl(repository);
    const answers = {
      repository,
      homepage: gitInfo && gitInfo.browse(),
      gitInfo: gitInfo && helper.parseGitUrl(gitInfo.ssh()),
    };

    this.setLocals(answers);
    return answers;
  }

  /**
   * Prompt function that takes a "question" object or array of question objects, and returns an object with responses from the user.
   *
   * additional: only add the answers which has the same name with question.
   *
   * @param {Array|Object} questions - Options objects for one or more prompts to run.
   * @param {Object} [answers] - contains values of already answered questions.
   * @return {Promise<Object>} Promise that returns an "answers" object with the user's responses.
   * @see https://github.com/node-modules/common-bin-plus/blob/master/lib/command.js#L78
   */
  async prompt(questions, answers = {}) {
    if (!Array.isArray(questions)) questions = [ questions ];

    const obj = {};
    for (const { name } of questions) {
      // if answers has the same name with questions, add it to already answers.
      if (answers.hasOwnProperty(name)) {
        obj[name] = answers[name];
      }
    }
    return await super.prompt(questions, obj);
  }

  /**
   * @typedef FileInfo
   * @type {Object}
   * @property {String} key - file name
   * @property {String} src - source template full path
   * @property {String} dest - target path
   * @property {Boolean} isText - whether file type is textfile
   * @property {Boolean} isTemplate - whether file need to be render
   * @property {String|Buffer} content - file content
   */


  /**
   * find all boilerplate files from prototype chain
   *
   * @param {Object} args - args
   * @param {String[]} args.loadUnits - all boilerpate base dirs
   * @param {String} [args.directory] - boilerpate dir name, default to `boilerplate`
   * @param {String} [args.pattern] - glob pattern, default to `** / *`
   * @return {Object<string, FileInfo>} all boilerplate files
   */
  async listFiles({ loadUnits, directory, pattern }) {
    const result = [];
    for (const dir of loadUnits) {
      const root = path.join(dir, directory || 'boilerplate');
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
   *  - `fileInfo.isTemplate`: whether skip render or not
   *
   * @param {Object} args - args
   * @param {FileInfo} args.fileInfo - file info
   */
  async normalizeFileInfo({ fileInfo }) {
    let fileName = fileInfo.key;
    fileInfo.isTemplate = this.templateMatcher(fileInfo.key);
    if (fileInfo.isTemplate) {
      // convert speical file name, such as `_package.json`, `{{ name }}.test.js`
      fileName = await this.renderTemplate(fileInfo.key, this.locals);
    }
    fileInfo.dest = path.join(this.baseDir, fileName);
  }

  /**
   * load file content to `fileInfo.content` and detect `fileInfo.isText` and `fileInfo.isTemplate`
   *
   * @param {Object} args - args
   * @param {FileInfo} args.fileInfo - file info
   */
  async loadFile({ fileInfo }) {
    fileInfo.content = await fs.readFile(fileInfo.src);
    fileInfo.isText = isText(fileInfo.fileName, fileInfo.content);
  }

  /**
   * do what you want to process file, such as render template
   *
   * @param {Object} args - args
   * @param {FileInfo} args.fileInfo - file info
   * @param {FileInfo[]} args.files - files list
   */
  async processFile({ fileInfo }) {
    const { key, isTemplate } = fileInfo;
    if (fileInfo.isText && isTemplate) {
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
      created: Date.now(),
    };

    pkg.dependencies = pkg.dependencies || {};

    // may not publish yet, so will fail at npm install
    // if (!process.env.BOILERPLATE_TEST) {
    //   pkg.devDependencies = pkg.devDependencies || {};
    //   pkg.devDependencies[this.pkgInfo.name] = `^${this.pkgInfo.version}`;
    // }
    return pkg;
  }

  /**
   * save file to `fileInfo.dest`
   *
   * @param {Object} args - args
   * @param {FileInfo} args.fileInfo - file info
   * @param {FileInfo[]} args.files - files list
   * @param {FileInfo} args.fileInfo - file info
   */
  async saveFile({ fileInfo }) {
    await mkdirp(path.dirname(fileInfo.dest));
    await fs.writeFile(fileInfo.dest, fileInfo.content);
    this.logger.debug(`saved: ${fileInfo.dest}`);
  }

  /**
   * send http request
   * @param {String} url - target url
   * @param {Object} opts - request options
   * @return {Promise<Object>} response
   */
  async request(url, opts) {
    opts = extend(true, this.requestOpts, opts);
    this.logger.debug(`${opts.method} ${url}`);
    return await this.httpclient.request(url, opts);
  }

  /**
   * install deps
   *
   * @param {Object} argvObj - argv pass to npm
   * @param {Object} [opts] - opts pass to fork
   * @return {Promise} exec result
   */
  async installDeps(argvObj, opts) {
    const argv = this.helper.unparseArgv({
      registry: this.locals.registry,
      'no-package-lock': true,
      ...argvObj,
    });
    const cmd = `${this.locals.npm} install ${argv.join(' ')}`;
    this.logger.info(cmd);
    return await this.helper.exec(cmd, { cwd: this.baseDir, ...opts });
  }

  /**
   * run unit test
   *
   * @param {Object} [argvObj] - the argv pass to scripts, such as { optional: false }
   * @param {Object} [opts] - opts pass to fork
   * @return {Promise} exec result
   */
  async runTest(argvObj, opts) {
    return await this.runScript('test', argvObj, opts);
  }

  /**
   * run scripts at targetDir, will use `this.local.npm` as cli
   *
   * @param {String} scriptName - scripts name, such as `start` / `test`
   * @param {Object} [argvObj] - the argv pass to scripts, such as { prod: true }
   * @param {Object} [opts] - opts pass to fork
   * @return {Promise} exec result
   */
  async runScript(scriptName, argvObj = {}, opts = {}) {
    const argv = this.helper.unparseArgv(argvObj);
    const cmd = `${this.locals.npm} run ${scriptName} -- ${argv.join(' ')}`;
    this.logger.info(cmd);
    return await this.helper.exec(cmd, { cwd: this.baseDir, ...opts });
  }

  /**
   * render template with locals
   *
   * @param {String} tpl - template content
   * @param {Object} locals - variable scope
   * @return {String} new content
   */
  async renderTemplate(tpl, locals) {
    return this.renderEngine.renderString(tpl.toString(), locals);
  }

  /**
   * get boilerplate directories from prototype chain
   * @return {Array<String>} paths
   * @private
   */
  get boilerplatePaths() {
    if (this[BOILERPLATE_PATHS]) return this[BOILERPLATE_PATHS];

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

    this[BOILERPLATE_PATHS] = paths;
    return paths;
  }
}

module.exports = BaseBoilerplate;
