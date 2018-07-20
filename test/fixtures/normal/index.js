'use strict';

const BaseBoilerplate = require('../../../index');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  constructor(...args) {
    super(...args);

    this.questions = [
      {
        type: 'input',
        name: 'name',
        message: 'What\'s your project name:',
      },
      {
        type: 'input',
        name: 'description',
        message: 'What\'s your project description:',
        default: 'default desc',
      },
    ];
  }

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }
};
