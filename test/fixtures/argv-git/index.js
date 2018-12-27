'use strict';

const BaseBoilerplate = require('../../..');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async askQuestions() {
    await super.askQuestions();
    this.locals.localInfo = JSON.stringify(this.locals, null, 2);
  }

  async npmInstall() {
    // skip
  }

  async runTest() {
    // skip
  }
};
