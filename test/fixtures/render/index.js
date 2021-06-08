'use strict';

const BaseBoilerplate = require('../../..');

module.exports = class TestBoilerplate extends BaseBoilerplate {
  constructor(...args) {
    super(...args);
    this.templateRules = [ '!boilerplate/**' ];
  }

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async initQuestions() {
    return [
      ...await super.initQuestions(),
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

  async runTest() {
    // skip
  }
};
