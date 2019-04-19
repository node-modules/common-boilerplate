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
      {
        name: 'a.b',
        type: 'input',
        message: 'Nested:',
      },
    ];
  }

  async installDeps() {
    // skip
  }

  async runTest() {
    // skip
  }
};
