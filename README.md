# common-boilerplate

base class for boilerplate

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![NPM download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/common-boilerplate.svg?style=flat-square
[npm-url]: https://npmjs.org/package/common-boilerplate
[travis-image]: https://img.shields.io/travis/node-modules/common-boilerplate.svg?style=flat-square
[travis-url]: https://travis-ci.org/node-modules/common-boilerplate
[codecov-image]: https://codecov.io/gh/node-modules/common-boilerplate/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/node-modules/common-boilerplate
[david-image]: https://img.shields.io/david/node-modules/common-boilerplate.svg?style=flat-square
[david-url]: https://david-dm.org/node-modules/common-boilerplate
[snyk-image]: https://snyk.io/test/npm/common-boilerplate/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/common-boilerplate
[download-image]: https://img.shields.io/npm/dm/common-boilerplate.svg?style=flat-square
[download-url]: https://npmjs.org/package/common-boilerplate

## Usage

```bash
$ npm i common-boilerplate --save
```

## Write your boilerplate

use [boilerplate-boilerplate](https://github.com/node-modules/boilerplate-boilerplate) for quick start.

```bash
$ npm i boilerplate-boilerplate
$ node ./node_modules/boilerplate-boilerplate/bin/cli.js
```

### Lifecycle

```bash
- ask question
- list all file from boilerplate paths
- render files to target dir
- npm install
- unit test
```

### Directory

```bash
├── boilerplate
│   ├── lib
│   ├── test
│   ├── README.md
│   ├── _.eslintrc
│   ├── _.gitignore
│   ├── _package.json
│   └── index.js
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
module.exports.testUtils = Boilerplate.testUtils;
```

### Ask questions

[Inquirer](https://github.com/SBoudrias/Inquirer.js) is built-in to provide `prompt` helper.

Add your questions:

```js
class MainBoilerplate extends Boilerplate {
  initQuestions() {
    const questions = [
      // remain super questions
      ...super.initQuestions(),

      // add new questions
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
      }
    ];
    return questions;
  }
  // ...
};
```

### Locals

`this.locals` is used to fill the teamplte, it's merge from `built-int -> argv -> user's prompt answer`;

**Built-in:**

- `name` - project name, by default to `git repository name`
- `user` - user info
  - `name` - `git config user.name`
  - `email` - read from git user email
  - `author` - `${user} <${email}>`
- `git` - git url info
  - extract from `git config remote.origin.url`
  - see [git-url-parse](https://github.com/IonicaBizau/git-url-parse) for more details.
- `npm` - npm global cli name, will guest by order: `tnpm -> cnpm -> npm`
- `registry` - npm registry url, not set by default

### Template Render

Built-in render is very simple:

- `{{ test }}` will replace
- `\{{ test }}` will skip
- support nested value such as `{{ obj.test }}`
- unknown variable will render as empty string

**Custom your render logic:**

```js
// recommended to use https://github.com/mozilla/nunjucks
const nunjucks = require('nunjucks');

// perfer to disable auto escape
nunjucks.configure({ autoescape: false });

class MainBoilerplate extends Boilerplate {
  async renderTemplate(tpl, locals) {
    return nunjucks.renderString(tpl, locals);
  }

  // custom your locals
  async initLocals() {
    const locals = await super.initLocals();
    locals.foo = 'bar';
    return locals;
  }
};
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

Provide powerful cli logger for developer, see [signale](https://github.com/klauscfhq/signale) for more details.

`debug` is disabled by default, use `--verbose` to print all logs.

```js
this.logger.info('this is a log');

this.logger.disable([ 'info', 'debug' ]);

this.logger.enable('debug');
```

### CommandLine argv

Also support custom argv:

- if pass the same name with question, then skip asking user and write it to `locals`
- `argv` will convert to camelCase, such as `--page-size=1 -> pageSize`
- dot prop will convert to nested object, such as `--page.size=1 -> { page: { size: '1' } }`
- see [yargs#optionskey](https://github.com/yargs/yargs/blob/master/docs/api.md#optionskey-opt) for more details

```js
class MainBoilerplate extends Boilerplate {
  // use as `--test=123 --str=456`
  initOptions() {
    const options = super.initOptions();

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
- `--registry=` - npm registry url, also support alias `-r=china`

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
// don't forgot to exports `testUtils`
module.exports.testUtils = Boilerplate.testUtils;
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
module.exports.testUtils = ShareBoilerplate.testUtils;
```

- must provide getter `Symbol.for('boilerplate#root')` to announce your root, and `boilerplate` directory is required to exists at your root directory.
- will auto load all files from boilerplate, same key will be override.
- you could custom by `async listFiles()`, such as ignore some files from parent.

## Unit Testing

Extends [Coffee](https://github.com/node-modules/coffee) to provide testUtils for cli.

```js
const testUtils = require('common-boilerplate').testUtils;

describe('test/index.test.js', () => {
  it('should work', () => {
    return testUtils.run()
      // .debug()
      .waitForPrompt()
      // answer to the questions
      .write('example\n')
      // emit `DOWN` key to select the second choise
      .choose(2)

      // expect README.md to be exists
      .expectFile('README.md')

      // check with `includes`
      .expectFile('README.md', 'this is a desc')

      // check with regex
      .expectFile('README.md', /desc/)

      // check whether contains
      .expectFile('package.json', { name: 'example' })

      // opposite assertion
      .notExpectFile('not-exist')
      .notExpectFile('README.md', 'sth')

      // see others at `coffee` docs
      .expect('stdout', /some console message/)
      .expect('stderr', /some error message/)
      .expect('code', 0)

      // don't forgot to call `end()`
      .end();
  });
});
```