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
    const questions = super.initQuestions();

    questions.push(
      {
        type: 'list',
        name: 'type',
        message: 'choose your type:',
        choices: [ 'simple', 'plugin', 'framework' ],
      }
    );
    return questions;
  }
  // ...
};
```

`Prompt` as your wish:

```js
class MainBoilerplate extends Boilerplate {
  async askQuestions() {
    // DO NOT use `Inquirer` directly
    // just use `this.prompt` which will emit event for unit testing
    const answer = await this.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What\'s your project name:',
      },
    ]);

    // should write to `this.locals`
    Object.assign(this.locals, answer);
  }
};
```

### Template Render

Built-in render is very simple:

- `this.locals` will be use to fill the teamplte
  - come from user's prompt answer
  - built-in locals:
    - `repository` - read from git remote url
    - `org` - read from git remote url
    - `name` - read from git remote url
    - `user` - read from git user name
    - `email` - read from git user email
    - `author` - `${user} <${email}>`
- Rule:
  - `{{ test }}` will replace
  - `\{{ test }}` will skip
  - not support `{{ obj.test }}`
  - unknown variable will left as what it is

Custom your render logic:

```js
// recommended to use https://github.com/mozilla/nunjucks
const nunjucks = require('nunjucks');

// could disable auto escape
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