'use strict';

const BaseBoilerplate = require('../../..');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  initQuestions() {
    return [
      ...super.initQuestions(),
      {
        name: 'name',
        type: 'input',
        message: 'Project Name: ',
      },
      {
        name: 'description',
        type: 'input',
        message: 'Description:',
      },
    ];
  }

  async askQuestions() {
    await super.askQuestions();
    this.locals.localInfo = JSON.stringify(this.locals, null, 2);
  }

  async installDeps() {
    // skip
  }

  async runTest() {
    // skip
  }
};
