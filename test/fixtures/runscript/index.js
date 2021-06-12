'use strict';

const BaseBoilerplate = require('../../..');

module.exports = class TestBoilerplate extends BaseBoilerplate {
  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async doPostJob() {
    await this.installDeps({ optional: false });
    await this.runTest({ grep: 'home' });
  }
};
