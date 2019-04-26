'use strict';

const BaseBoilerplate = require('../../../lib/base');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async initLocals() {
    const locals = await super.initLocals();
    const { data: pkgInfo } = await this.request(`${locals.registry}/common-boilerplate/latest`, { dataType: 'json' });
    locals.foo = `${pkgInfo.name}@${pkgInfo.version}`;

    try {
      await this.request('http://127.0.0.1:4321/not-exist');
    } catch (_) {
      // ignore
    }
    return locals;
  }

  async installDeps() {
    // skip
  }

  async runTest() {
    // skip
  }
};
