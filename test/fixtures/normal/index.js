'use strict';

const BaseBoilerplate = require('../../../index');

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
      },
      {
        name: 'repository',
        type: 'input',
        message: 'Repository:',
        default: () => this.locals.git.href,
      },
      {
        name: 'author',
        type: 'input',
        message: 'Author:',
        default: () => this.locals.user.author,
      },
      {
        type: 'list',
        name: 'type',
        message: 'choose your type:',
        choices: [ 'simple', 'plugin', 'framework' ],
      },
    ];
  }
}

module.exports = TestBoilerplate;
