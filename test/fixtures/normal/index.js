'use strict';

const path = require('path');
const { sleep } = require('mz-modules');
const BaseBoilerplate = require('../../../index');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  * prompt() {
    let result = yield this.inquirer.prompt([
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
    console.log(result);

    // simulation anther prompt after a long task
    yield sleep('1s');

    result = yield this.inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'choose your type:',
        choices: [ 'aaa', 'bbb', 'ccc' ],
      },
    ]);
    console.log(result);

    return Object.assign(this.context.argv, result);
  }
};
