'use strict';

const BaseBoilerplate = require('../../../index');

class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  initQuestions() {
    return [
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
        default: () => this.locals.repository,
      },
      {
        name: 'author',
        type: 'input',
        message: 'Author:',
        default: () => `${this.locals.user} <${this.locals.email}>`,
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
