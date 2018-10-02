'use strict';

const path = require('path');
const testUtils = require('..').testUtils;

describe('test/argv.test.js', () => {
  it('should merge argv to locals', () => {
    const options = {
      baseDir: 'argv',
      args: [ '--name=argv', '--test=123', '--a.b.c=456' ],
    };
    return testUtils.run(options)
      .debug()
      .write('this is a desc\n')
      .expectFile('README.md', 'name = argv')
      .expectFile('README.md', 'description = this is a desc')
      .expectFile('README.md', 'test = 123')
      .expectFile('README.md', 'nested = 456')
      .expect('code', 0)
      .end();
  });

  describe('baseDir', () => {
    const cwd = path.join(__dirname, '.tmp');

    it('--baseDir', () => {
      const options = {
        baseDir: 'argv',
        args: [ '--baseDir', '.tmp' ],
        opt: {
          cwd: __dirname,
        },
      };
      return testUtils.run(options)
        // .debug()
        .write('example\n')
        .write('this is a desc\n')
        .expectFile('README.md', `# README\n\nbaseDir = ${cwd}\n`)
        .expect('code', 0)
        .end();
    });

    it('--baseDir absolute', () => {
      const options = {
        baseDir: 'argv',
        args: [ '--baseDir', cwd ],
        opt: {
          cwd: path.dirname(cwd),
        },
      };
      return testUtils.run(options)
        // .debug()
        .write('example\n')
        .write('this is a desc\n')
        .expectFile('README.md', `# README\n\nbaseDir = ${cwd}\n`)
        .expect('code', 0)
        .end();
    });

    it('argv._[0]', () => {
      const options = {
        baseDir: 'argv',
        args: [ cwd ],
      };
      return testUtils.run(options)
        // .debug()
        .write('example\n')
        .write('this is a desc\n')
        .expectFile('README.md', `# README\n\nbaseDir = ${cwd}\n`)
        .expect('code', 0)
        .end();
    });
  });
});
