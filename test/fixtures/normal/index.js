'use strict';

const path = require('path');
const { sleep } = require('mz-modules');
const BaseBoilerplate = require('../../../index');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  * prompt() {
    const result = yield this.inquirer.prompt([
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
    ]);

    return result;
  }
};
