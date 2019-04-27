'use strict';

const path = require('path');
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
    await coffee.fork(path.join(fixtures, 'simple/bin/cli.js'), [], { cwd: tmpDir })
      // .debug()
      .waitForPrompt()
      .writeKey('example\n')
      .writeKey('ENTER')
      .writeKey('DOWN', 'ENTER')
      .expect('stdout', /npm install .* --no-package-lock/)
      .expect('stdout', /1 passing/)
      .expect('code', 0)
      .end();


    assertFile(`${tmpDir}/README.md`, /name = example/);
    assertFile(`${tmpDir}/README.md`, /description = this is description of example/);
    assertFile(`${tmpDir}/README.md`, /type = plugin/);
    assertFile(`${tmpDir}/README.md`, /empty =\s{1}\n/);
    assertFile(`${tmpDir}/README.md`, /escapse = {{ name }}/);
    assertFile(`${tmpDir}/test/example.test.js`, /const assert = require\('assert'\);/);
    assertFile(`${tmpDir}/.gitignore`);
    assertFile(`${tmpDir}/.eslintrc`);
    assertFile(`${tmpDir}/github.png`);
    assertFile(`${tmpDir}/package.json`, {
      name: 'example',
      description: 'this is description of example',
      boilerplate: {
        name: 'common-boilerplate-test-project',
        version: '1.0.0',
      },
      devDependencies: {
        'common-boilerplate-test-project': '^1.0.0',
      },
    });
  });

  it('should support multi-level boilerplate', async () => {
    await coffee.fork(path.join(fixtures, 'multi-level/bin/cli.js'), [], { cwd: tmpDir })
      // .debug()
      .waitForPrompt()
      .writeKey('example\n')
      .writeKey('this is a desc\n')
      .writeKey('DOWN', 'ENTER')
      .end();

    // override file
    assertFile(`${tmpDir}/README.md`, /# README\n\noverride/);
    // additional file
    assertFile(`${tmpDir}/index.json`);
    // remove file
    assertFile.fail(`${tmpDir}/github.png`);

    assertFile(`${tmpDir}/package.json`, {
      name: 'example',
      boilerplate: {
        name: 'multi-level',
        version: '1.1.0',
      },
      devDependencies: {
        'multi-level': '^1.1.0',
      },
    });
  });
});
