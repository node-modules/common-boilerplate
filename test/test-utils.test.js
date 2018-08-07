'use strict';

const testUtils = require('..').testUtils;
const assert = require('assert');
require('assert-extends');

describe.only('test/test-utils.test.js', () => {
  it('should work', () => {
    return testUtils.run('test-utils')
      .expectFile('README.md', /# README/)
      .notExpectFile('no-exist')
      // .expectFile('index.json', { child: { name: 'tz' } })
      .expectJSON('index.json', { child: { name: 'tz' } })
      .notExpectJSON('index.json', { child: { name: 'no-exist' } })
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

  it('should expectFile fail when no-exist', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .expectFile('no-exist', /nth/)
        .expect('code', 1)
        .end();
    }, /no-exist` should exists before check rule `\/nth\//);
  });

  it('should notExpectFile fail', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        .notExpectFile('README.md')
        .expect('code', 1)
        .end();
    }, /README.md` should not exists/);
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

  it('should notExpectFile fail with pattern when no-exist', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .notExpectFile('no-exist', /# README/)
        .expect('code', 1)
        .end();
    }, /no-exist` should exists before check opposite rule `\/# README\/\(RegExp\)`/);
  });

  it('should expectJSON fail', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .expectJSON('index.json', { child: { name: 'no-exists' } })
        .expect('code', 1)
        .end();
    }, /index.json` should match rule `{"child":{"name":"no-exists"}}\(Object\)` with content `{"name"/);
  });

  it('should expectJSON fail when no-exist', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .expectJSON('no-exist', { name: 'tz' })
        .expect('code', 1)
        .end();
    }, /no-exist` should exists before check rule `{"name":"tz"}\(Object\)`/);
  });

  it('should notExpectJSON fail', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        .notExpectJSON('index.json')
        .expect('code', 1)
        .end();
    }, /index.json` should not exists/);
  });

  it('should notExpectJSON fail with pattern', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .notExpectJSON('index.json', { name: 'test' })
        .expect('code', 1)
        .end();
    }, /index.json` should not match rule `{"name":"test"}\(Object\)` with content `{"name":"test"/);
  });

  it('should notExpectJSON fail with pattern when no-exist', async () => {
    return assert.asyncThrows(() => {
      return testUtils.run('test-utils')
        // .debug()
        .notExpectJSON('no-exist', { name: 'test' })
        .expect('code', 1)
        .end();
    }, /no-exist` should exists before check opposite rule `{"name":"test"}\(Object\)`/);
  });
});
