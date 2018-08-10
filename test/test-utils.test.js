'use strict';

const testUtils = require('..').testUtils;
const assert = require('assert');
const path = require('path');
require('assert-extends');

describe('test/test-utils.test.js', () => {
  it('should work', () => {
    return testUtils.run('test-utils')
      // .debug()
      .expectFile('README.md', '# README')
      .expectFile('README.md', /# README/)
      .expectFile(path.join(__dirname, '.tmp/README.md'))
      .notExpectFile('no-exist')
      .notExpectFile(path.join(__dirname, '.tmp/no-exist'))
      .expectFile('index.json', { child: { name: 'tz' } })
      .expectFile('index.json', { child: { name: 'tz' } })
      .notExpectFile('index.json', { child: { name: 'no-exist' } })
      .expect('code', 0)
      .end();
  });

  it('should work with options.baseDir', () => {
    return testUtils.run({
      baseDir: path.join(__dirname, 'fixtures/test-utils'),
    })
      .expectFile('README.md', '# README')
      .expect('code', 0)
      .end();
  });

  it('should warn when write too much', () => {
    return testUtils.run({
      baseDir: path.join(__dirname, 'fixtures/test-utils'),
    })
      .debug()
      .write('\n')
      .expectFile('README.md', '# README')
      // .expect('stdout', /stdin is not empty, write\(\) too much/)
      .expect('code', 0)
      .end();
  });

  it('should expectFile fail', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        .expectFile('README.md', /nth/)
        .expect('code', 1)
        .end();
    }, /README.md` should match rule `\/nth\/\(RegExp\)` with content `# README/);
  });

  it('should expectFile fail with string ', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        .expectFile('README.md', 'abc')
        .expect('code', 1)
        .end();
    }, /README.md` should includes `abc\(String\)` with content `# README/);
  });

  it('should expectFile fail with JSON ', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .expectFile('index.json', { child: { name: 'no-exists' } })
        .expect('code', 1)
        .end();
    }, /index.json` should contains `{"child":{"name":"no-exists"}}\(Object\)` with content `{"name"/);
  });

  it('should expectFile fail with JSON when no-exist', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .expectFile('no-exist', { name: 'tz' })
        .expect('code', 1)
        .end();
    }, /no-exist` should exists before check rule `{"name":"tz"}\(Object\)`/);
  });

  it('should notExpectFile fail with pattern', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .notExpectFile('README.md', /# README/)
        .expect('code', 1)
        .end();
    }, /README.md` should not match rule `\/# README\/\(RegExp\)` with content `# README/);
  });

  it('should notExpectFile fail with string', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .notExpectFile('README.md', '# README')
        .expect('code', 1)
        .end();
    }, /README.md` should not includes `# README\(String\)` with content `# README/);
  });

  it('should notExpectFile fail with pattern when no-exist', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .notExpectFile('no-exist', /# README/)
        .expect('code', 1)
        .end();
    }, /no-exist` should exists before check opposite rule `\/# README\/\(RegExp\)`/);
  });

  it('should notExpectFile fail with JSON', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .notExpectFile('index.json', { name: 'test' })
        .expect('code', 1)
        .end();
    }, /index.json` should not contains `{"name":"test"}\(Object\)` with content `{"name":"test"/);
  });

  it('should notExpectFile fail with JSON when no-exist', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .notExpectFile('no-exist', { name: 'test' })
        .expect('code', 1)
        .end();
    }, /no-exist` should exists before check opposite rule `{"name":"test"}\(Object\)`/);
  });
});
