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
├── bin
│   └── cli.js
├── boilerplate
│   ├── bin
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

### Ask questions

### Template Render

## Unit Testing

Extends [Coffee](https://github.com/node-modules/coffee) to provide testUtils for cli

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