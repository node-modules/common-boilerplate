'use strict';

const BaseBoilerplate = require('../../../index');

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

  async npmInstall() {
    // skip
  }

  async runTest() {
    // skip
  }
};
