'use strict';

const { sleep } = require('mz-modules');
const BaseBoilerplate = require('../../../index');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  * prompt() {
    const result = {};

    const answer1 = yield this.inquirer.prompt([
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
    Object.assign(this.context.argv, result);

    // simulation anther prompt after a long task
    yield sleep('1s');

    const answer2 = yield this.inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'choose your type:',
        choices: [ 'simple', 'plugin', 'framework' ],
      },
    ]);

    return Object.assign(result, answer1, answer2);
  }
};
