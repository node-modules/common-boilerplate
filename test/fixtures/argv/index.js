'use strict';

const BaseBoilerplate = require('../../..');

module.exports = class TestBoilerplate extends BaseBoilerplate {

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
    ], this.locals);

    this.setLocals(answers);
    this.locals.localInfo = JSON.stringify(this.locals, null, 2);
  }
};
