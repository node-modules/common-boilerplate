'use strict';

const path = require('path');
const coffee = require('coffee');
const assertFile = require('assert-file');
const { rimraf, mkdirp } = require('mz-modules');
const runscript = require('runscript');

describe('test/argv.test.js', () => {
  const fixtures = path.join(__dirname, 'fixtures');
  const tmpDir = path.join(__dirname, '.tmp');

  beforeEach(async () => {
    await rimraf(tmpDir);
    await mkdirp(tmpDir);
  });

  it('should merge argv to locals', async () => {
    await coffee.fork(path.join(fixtures, 'argv/bin/cli.js'), [ '--name=argv', '--test=123', '--a.b.c=456' ], { cwd: tmpDir })
      .debug()
      .waitForPrompt()
      .writeKey('this is a desc\n')
      .writeKey('ENTER')
      .expect('code', 0)
      .end();

    assertFile(`${tmpDir}/README.md`, `baseDir = ${tmpDir}`);
    assertFile(`${tmpDir}/README.md`, 'name = argv');
    // will use the first write() due to `name` is consumed by argv
    assertFile(`${tmpDir}/README.md`, 'description = this is a desc');
    assertFile(`${tmpDir}/README.md`, 'test = 123');
    assertFile(`${tmpDir}/README.md`, 'nested = 456');
  });

  describe('baseDir', () => {
    const cwd = path.join(__dirname, '.tmp');

    it('--baseDir', async () => {
      await rimraf(tmpDir);
      await coffee.fork(path.join(fixtures, 'argv/bin/cli.js'), [ '--baseDir', '.tmp' ], { cwd: __dirname })
        // .debug()
        .waitForPrompt()
        .writeKey('example\n')
        .writeKey('this is a desc\n')
        .writeKey('ENTER')
        .expect('code', 0)
        .end();

      assertFile(`${tmpDir}/README.md`, `baseDir = ${tmpDir}`);
    });

    it('--baseDir absolute', async () => {
      await coffee.fork(path.join(fixtures, 'argv/bin/cli.js'), [ '--baseDir', tmpDir ], { cwd: path.dirname(cwd) })
        // .debug()
        .waitForPrompt()
        .writeKey('example\n')
        .writeKey('this is a desc\n')
        .writeKey('ENTER')
        .expect('code', 0)
        .end();

      assertFile(`${tmpDir}/README.md`, `baseDir = ${tmpDir}`);
    });


    it('argv._[0]', async () => {
      await coffee.fork(path.join(fixtures, 'argv/bin/cli.js'), [ tmpDir ])
        // .debug()
        .waitForPrompt()
        .writeKey('example\n')
        .writeKey('this is a desc\n')
        .writeKey('ENTER')
        .expect('code', 0)
        .end();

      assertFile(`${tmpDir}/README.md`, `baseDir = ${tmpDir}`);
    });
  });

  describe('locals: npm', () => {
    it('should guest npm', async () => {
      await coffee.fork(path.join(fixtures, 'argv/bin/cli_mock.js'), [], { cwd: tmpDir })
        // .debug()
        .waitForPrompt()
        .writeKey('example\n')
        .writeKey('this is a desc\n')
        .writeKey('ENTER')
        .expect('code', 0)
        .end();

      assertFile(`${tmpDir}/README.md`, 'npm = cnpm');
    });

    it('should support --npm', async () => {
      await coffee.fork(path.join(fixtures, 'argv/bin/cli.js'), [ '--npm=pnpm' ], { cwd: tmpDir })
        // .debug()
        .waitForPrompt()
        .writeKey('example\n')
        .writeKey('this is a desc\n')
        .writeKey('ENTER')
        .expect('code', 0)
        .end();

      assertFile(`${tmpDir}/README.md`, 'npm = pnpm');
    });
  });

  describe('locals: registry', () => {
    it('should left registry undefined', async () => {
      await coffee.fork(path.join(fixtures, 'argv/bin/cli.js'), [], { cwd: tmpDir })
        // .debug()
        .waitForPrompt()
        .writeKey('example\n')
        .writeKey('this is a desc\n')
        .writeKey('ENTER')
        .expect('code', 0)
        .end();

      assertFile(`${tmpDir}/README.md`, 'registry =');
    });

    it('should convert --registry=china', async () => {
      await coffee.fork(path.join(fixtures, 'argv/bin/cli.js'), [ '--registry=china' ], { cwd: tmpDir })
        // .debug()
        .waitForPrompt()
        .writeKey('this is a desc\n')
        .writeKey('ENTER')
        .expect('code', 0)
        .end();

      assertFile(`${tmpDir}/README.md`, 'registry = https://registry.nlark.com');
    });

    it('should convert --registry=npm', async () => {
      await coffee.fork(path.join(fixtures, 'argv/bin/cli.js'), [ '--registry=npm' ], { cwd: tmpDir })
        // .debug()
        .waitForPrompt()
        .writeKey('this is a desc\n')
        .writeKey('ENTER')
        .expect('code', 0)
        .end();

      assertFile(`${tmpDir}/README.md`, 'registry = https://registry.npmjs.org');
    });

    it('should convert --registry=http://custom/', async () => {
      await coffee.fork(path.join(fixtures, 'argv/bin/cli.js'), [ '--registry=http://custom/' ], { cwd: tmpDir })
        // .debug()
        .waitForPrompt()
        .writeKey('this is a desc\n')
        .writeKey('ENTER')
        .expect('code', 0)
        .end();

      assertFile(`${tmpDir}/README.md`, 'registry = http://custom');
    });
  });

  describe('locals: git', () => {
    it('should read git info', async () => {
      await runscript('git init', { cwd: tmpDir });
      await runscript('git config user.name Pig', { cwd: tmpDir });
      await runscript('git config user.email tz@pig.com', { cwd: tmpDir });
      await runscript('git remote add origin git@github.com:tz/test.git', { cwd: tmpDir });

      await coffee.fork(path.join(fixtures, 'argv-git/bin/cli.js'), [], { cwd: tmpDir })
        // .debug()
        .waitForPrompt()
        .writeKey('example\n')
        .writeKey('this is a desc\n')
        .writeKey('ENTER')
        .expect('code', 0)
        .end();

      // use git name
      assertFile(`${tmpDir}/README.md`, 'name = test');
      assertFile(`${tmpDir}/local.json`, {
        user: {
          name: 'Pig',
          email: 'tz@pig.com',
          author: 'Pig <tz@pig.com>',
        },
        gitInfo: {
          href: 'git@github.com:tz/test.git',
          name: 'test',
          owner: 'tz',
          organization: 'tz',
        },
      });
    });
  });
});
