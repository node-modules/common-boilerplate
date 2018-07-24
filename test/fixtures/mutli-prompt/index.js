'use strict';

const { sleep } = require('mz-modules');
const BaseBoilerplate = require('../../../index');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async askQuestions() {
    const answer1 = await this.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What\'s your project name:',
        default: async () => {
          // test for emit event
          await sleep(100);
          return 'test_default';
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'What\'s your project description:',
        default: 'default desc',
        filter(v) {
          return sleep(100).then(() => v);
        },
      },
    ]);

    // simulation anther prompt after a long task
    await sleep('1s');

    const answer2 = await this.prompt(
      {
        type: 'list',
        name: 'type',
        message: 'choose your type:',
        choices: [ 'simple', 'plugin', 'framework' ],
      }
    );

    Object.assign(this.locals, answer1, answer2);
  }
};
