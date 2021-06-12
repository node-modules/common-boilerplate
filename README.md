# common-boilerplate

base class for boilerplate

[![NPM version](https://img.shields.io/npm/v/common-boilerplate.svg?style=flat-square)](https://npmjs.org/package/common-boilerplate)
[![NPM quality](http://npm.packagequality.com/shield/common-boilerplate.svg?style=flat-square)](http://packagequality.com/#?package=common-boilerplate)
[![NPM download](https://img.shields.io/npm/dm/common-boilerplate.svg?style=flat-square)](https://npmjs.org/package/common-boilerplate)

[![Continuous Integration](https://github.com/node-modules/common-boilerplate/actions/workflows/nodejs.yml/badge.svg)](https://github.com/node-modules/common-boilerplate/actions/workflows/nodejs.yml)
[![Test coverage](https://img.shields.io/codecov/c/github/node-modules/common-boilerplate.svg?style=flat-square)](https://codecov.io/gh/node-modules/common-boilerplate)

## Write your boilerplate

use [create-common-boilerplate](https://github.com/node-modules/create-common-boilerplate) for quick start.

```bash
$ npm init common-boilerplate
```

### Lifecycle

```bash
- ask question
- list all file from boilerplate paths
- render files to target dir
- do post jobs
```

### Directory

```bash
├── bin
│   └── cli.js
│
├── boilerplate
│   ├── lib
│   ├── test
│   ├── README.md
│   ├── _.eslintrc
│   ├── _.gitignore
│   ├── _package.json
│   └── index.js
│
├── test
│   └── index.test.js
├── index.js
├── README.md
└── package.json
```

- `index.js` is your Boilerplate Logic, the main entry.
- `boilerplate/**` is your template dir, will be copy to dest.

### Boilerplate Entry

```js
// index.js
const Boilerplate = require('common-boilerplate');

class MainBoilerplate extends Boilerplate {
  // must provide your directory
  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }
};

module.exports = MainBoilerplate;
```

### Ask questions

[Inquirer](https://github.com/SBoudrias/Inquirer.js) is built-in to provide `prompt` helper.

Add your questions:

```js
class MainBoilerplate extends Boilerplate {
  async askQuestions() {
    const answers = await this.prompt([
      {
        name: 'name',
        type: 'input',
        message: 'Project Name: ',
        default: () => this.locals.name, // set default from locals
      },
      {
        type: 'list',
        name: 'type',
        message: 'choose your type:',
        choices: [ 'simple', 'plugin', 'framework' ],
      },
    ]);
    this.setLocals(answers);

    // use built-in questions
    await this.askGit();
  }
};
```

**Built-in Questions:**

- `askNpm()`: ask for `name` / `scope` / `description`, and `pkgName` getter.
- `askGit()`: ask for `repository`

### Locals

`this.locals` is used to fill the template, it's merge from `built-in -> argv -> user's prompt answer`;

**Built-in:**

- `name` - project name, by default to `git repository name`
- `user` - user info
  - `name` - `git config user.name`
  - `email` - `git config user.email`
  - `author` - `${user} <${email}>`
- `gitInfo` - git url info
  - extract from `git config remote.origin.url`
  - see [git-url-parse](https://github.com/IonicaBizau/git-url-parse) for more details.
- `npm` - npm global cli name, will guest by order: `tnpm -> cnpm -> npm`
- `registry` - npm registry url, not set by default

### Template Render

Built-in render is [nunjucks](https://github.com/mozilla/nunjucks).

And use [micromatch](https://github.com/micromatch/micromatch) to match `this.templateRules` to treat as template.

```js
this.templateRules = [ '!res/**' ];
```

### File Name Convert

- also use template render, so `{{name}}.test.js` is supported.
- some file is special, so you can't use it's origin name
  - such as `boilerplate/package.json`, npm will read `files` and ignore your files.
  - use `_` as prefix, such as `_package.json` / `_.gitignore` / `_.eslintrc`
  - add your mapping by `this.fileMapping`

**Default mappings:**

```js
this.fileMapping = {
  gitignore: '.gitignore',
  _gitignore: '.gitignore',
  '_.gitignore': '.gitignore',
  '_package.json': 'package.json',
  '_.eslintrc': '.eslintrc',
  '_.eslintignore': '.eslintignore',
  '_.npmignore': '.npmignore',
};
```

### Logger

Provide powerful cli logger for developer, see [consola](https://github.com/unjs/consola) for more details.

`debug` is disabled by default, use `--verbose` or `DEBUG=` to print all logs.

```js
this.logger.info('this is info log');

this.logger.level = 'DEBUG';
```

### HttpClient

Provide httpclient for developer, see [urllib](https://github.com/node-modules/urllib) for more details.

```js
await this.request(url, opts);
```

Use `this.requestOpts` as default request options.


### RunScript

Provide runscript for developer, see [runscript](https://github.com/node-modules/runscript) for more details.

`cwd` is set to target dir, and will use `this.local.npm` as cli.

```js
await this.runScript('ci', { grep: 'home.test.js' }, {});

await this.installDeps({ optional : false });

await this.runTest({});
```

### CommandLine argv

Also support custom argv:

- `argv` will convert to camelCase, such as `--page-size=1 -> pageSize`
- dot prop will convert to nested object, such as `--page.size=1 -> { page: { size: '1' } }`
- see [yargs#optionskey](https://github.com/yargs/yargs/blob/master/docs/api.md#optionskey-opt) for more details

```js
class MainBoilerplate extends Boilerplate {
  // use as `--test=123 --str=456`
  initOptions() {
    const options = Object.assign({}, super.initOptions());

    options.test = {
      type: 'string',
      description: 'just a test',
    };

    options.str = {
      type: 'string',
      description: 'just a str',
    };

    return options;
  }
};
```

**Built-in:**

- `--baseDir=` - directory of application, default to `process.cwd()`
- `--npm=` - npm cli, tnpm/cnpm/npm, will auto guess
- `--registry=` - npm registry url, also support alias `-r=china`, will auto guest from npm cli.
- `--force` - force to override directory if it's not empty

### Boilerplate Chain

Support mutli-level boilerplate, so you can share logic between boilerplates.

```js
class ShareBoilerplate extends Boilerplate {
  // must provide your directory
  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }
};
module.exports = ShareBoilerplate;
```

```js
// child
class MainBoilerplate extends ShareBoilerplate {
  // must provide your directory
  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  // example for ignore some files from parent
  async listFiles(...args) {
    const files = await super.listFiles(...args);
    files['github.png'] = undefined;
    return files;
  }
};
module.exports = MainBoilerplate;
```

- must provide getter `Symbol.for('boilerplate#root')` to announce your root, and `boilerplate` directory is required to exists at your root directory.
- will auto load all files from boilerplate, same key will be override.
- you could custom by `async listFiles()`, such as ignore some files from parent.

## Unit Testing

Use [Coffee](https://github.com/node-modules/coffee) and [assert-file](https://github.com/node-modules/assert-file).

```js
const coffee = require('coffee');
const assertFile = require('assert-file');
const { rimraf, mkdirp } = require('mz-modules');

describe('test/index.test.js', () => {
  const fixtures = path.join(__dirname, 'fixtures');
  const tmpDir = path.join(__dirname, '.tmp');

  beforeEach(async () => {
    await rimraf(tmpDir);
    await mkdirp(tmpDir);
  });

  it('should work', async () => {
    // run cli
    await coffee.fork(path.join(fixtures, 'simple/bin/cli.js'), [], { cwd: tmpDir })
      // .debug()
      // tell coffee to listen prompt event then auto answer
      .waitForPrompt()
      // answer to the questions
      .writeKey('example\n')
      .writeKey('ENTER')
      // emit `DOWN` key to select the second choise
      .writeKey('DOWN', 'ENTER')
      .expect('stdout', /npm install --no-package-lock/)
      .expect('stdout', /1 passing/)
      .expect('code', 0)
      .end();

    // expect to be exists
    assertFile(`${tmpDir}/.gitignore`);

    // check with `includes`
    assertFile(`${tmpDir}/README.md`, 'name = example');

    // check with regex
    assertFile(`${tmpDir}/README.md`, /name = example/);

    // check whether contains json
    assertFile(`${tmpDir}/package.json`, {
      name: 'example',
      boilerplate: {
        name: 'common-boilerplate-test-project',
        version: '1.0.0',
      }
    });
  });
});
```
