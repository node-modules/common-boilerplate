'use strict';

const path = require('path');
const testUtils = require('..').testUtils;

describe('test/index.test.js', () => {

  it('should work', () => {
    return testUtils.run('normal')
      .waitForPrompt()
      .write('example\n')
      .write('this is a desc\n')
      .write('\n')
      .write('\n')
      .choose(1)
      .expectFile('README.md', /name = example/)
      .expectFile('README.md', /description = this is a desc/)
      .expectFile('README.md', /type = plugin/)
      .expectFile('README.md', /empty = {{ empty }}/)
      .expectFile('README.md', /escapse = {{ name }}/)
      .expectFile('test/example.test.js', /const mock = require\('egg-mock'\);/)
      .expectFile('.gitignore')
      .expectFile('.eslintrc')
      .expectFile('github.png')
      .expectJSON('package.json', {
        name: 'example',
        description: 'this is a desc',
        boilerplate: {
          name: 'normal',
          version: '1.0.0',
        },
      })
      .expect('code', 0)
      .end();
  });

  it('should support multi-level boilerplate', () => {
    return testUtils.run('multi-level')
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
      // replace string
      .expectFile('test/example.test.js')
      .expectFile('test/example.test.js', /const mock = require\('@ali\/mm'\);/)
      // new file
      .expectFile('index.json')
      // remove file
      .notExpectFile('github.png')
      .expectJSON('package.json', {
        name: 'example',
        description: 'this is a desc',
        author: 'egg',
        boilerplate: {
          name: 'multi-level',
          version: '1.0.0',
        },
      })
      .expect('code', 0)
      .end();
  });

  it('should support mutli prompt', () => {
    return testUtils.run('mutli-prompt')
      .waitForPrompt()
      .write('example\n')
      .write('this is a desc\n')
      .choose(1)

      // override file
      .expectFile('README.md', /name = example/)
      .expectFile('README.md', /description = this is a desc/)
      .expectFile('README.md', /type = plugin/)
      .expectFile('README.md', /empty = {{ empty }}/)
      .expectFile('README.md', /escapse = {{ name }}/)
      .expect('code', 0)
      .end();
  });

  describe('argv', () => {
    const cwd = path.join(__dirname, '.tmp');

    it('--baseDir', () => {
      const options = {
        baseDir: 'argv',
        // clean: false,
        args: [ '--baseDir', '.tmp' ],
        opt: {
          cwd: __dirname,
        },
      };
      return testUtils.run(options)
        .waitForPrompt()
        // .debug()
        .expect('stdout', /one context: true/)
        .expectFile('README.md', `# README\n\nbaseDir = ${cwd}\n`)
        .expect('code', 0)
        .end();
    });

    it('--baseDir absolute', () => {
      const options = {
        baseDir: 'argv',
        // clean: false,
        args: [ '--baseDir', cwd ],
        opt: {
          cwd: path.dirname(cwd),
        },
      };
      return testUtils.run(options)
        .waitForPrompt()
        // .debug()
        .expect('stdout', /one context: true/)
        .expectFile('README.md', `# README\n\nbaseDir = ${cwd}\n`)
        .expect('code', 0)
        .end();
    });

    it('argv._[0]', () => {
      const options = {
        baseDir: 'argv',
        // clean: false,
        args: [ cwd ],
      };
      return testUtils.run(options)
        .waitForPrompt()
        // .debug()
        .expect('stdout', /one context: true/)
        .expectFile('README.md', `# README\n\nbaseDir = ${cwd}\n`)
        .expect('code', 0)
        .end();
    });
  });
});
