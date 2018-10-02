'use strict';

const testUtils = require('..').testUtils;

describe('test/index.test.js', () => {

  it('should work', () => {
    return testUtils.run('normal')
      // .debug()
      .waitForPrompt()
      .write('example\n')
      .write('this is a desc\n')
      .write('\n')
      .write('\n')
      .choose(1)
      .expectFile('README.md', /name = example/)
      .expectFile('README.md', /description = this is a desc/)
      .expectFile('README.md', /type = plugin/)
      .expectFile('README.md', /empty =\s{1}\n/)
      .expectFile('README.md', /escapse = {{ name }}/)
      .expectFile('test/example.test.js', /const assert = require\('assert'\);/)
      .expectFile('.gitignore')
      .expectFile('.eslintrc')
      .expectFile('github.png')
      .expectFile('package.json', {
        name: 'example',
        description: 'this is a desc',
        boilerplate: {
          name: 'normal',
          version: '1.0.0',
        },
        // devDependencies: {
        //   normal: '^1.0.0',
        // },
      })
      .expect('code', 0)
      .expect('stdout', /npm install --no-package-lock/)
      .expect('stdout', /1 passing/)
      .end();
  });

  it('should support multi-level boilerplate', () => {
    return testUtils.run('multi-level')
      // .debug()
      .waitForPrompt()
      .write('example\n')
      .write('this is a desc\n')
      .write('\n')
      .write('\n')
      .choose(2)
      .write('ANOTHER\n')
      // override file
      .expectFile('README.md', /name = example/)
      .expectFile('README.md', /another = ANOTHER/)
      // new file
      .expectFile('index.json')
      // remove file
      .notExpectFile('github.png')
      .expectFile('package.json', {
        name: 'example',
        description: 'this is a desc',
        author: 'egg',
        boilerplate: {
          name: 'multi-level',
          version: '1.1.0',
        },
        // devDependencies: {
        //   'multi-level': '^1.1.0',
        // },
      })
      .expect('code', 0)
      .end();
  });
});
