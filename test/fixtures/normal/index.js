'use strict';

const BaseBoilerplate = require('../../../index');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  constructor(...args) {
    super(...args);

    this.questions.push(
      {
        type: 'list',
        name: 'type',
        message: 'choose your type:',
        choices: [ 'simple', 'plugin', 'framework' ],
      }
    );
  }

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }
};
