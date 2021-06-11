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

  async askQuestions() {
    const answers = await this.prompt([
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
    ]);

    this.setLocals(answers);
  }
};
