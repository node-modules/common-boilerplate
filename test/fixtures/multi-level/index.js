'use strict';

const BaseBoilerplate = require('../simple');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async listFiles(...args) {
    const files = await super.listFiles(...args);
    files['github.png'] = undefined;
    return files;
  }

  async npmInstall() {
    // do nth
  }

  async runTest() {
    // do nth
  }
};
