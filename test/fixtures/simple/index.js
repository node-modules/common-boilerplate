'use strict';

const BaseBoilerplate = require('../../..');

class TestBoilerplate extends BaseBoilerplate {

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
        default: () => this.locals.name,
      },
      {
        name: 'description',
        type: 'input',
        message: 'Description:',
        default: res => `this is description of ${res.name}`,
      },
      {
        type: 'list',
        name: 'type',
        message: 'Choose your type:',
        choices: [ 'simple', 'plugin', 'framework' ],
      },
    ];
  }
}

module.exports = TestBoilerplate;
