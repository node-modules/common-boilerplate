'use strict';

const BaseBoilerplate = require('../../../index');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  constructor(...args) {
    super(...args);

    this.locals = {
      eslint_config: 'eslint-config-egg',
    };

    // this.questions = {
    //   name: {
    //     type: 'input',
    //     name: 'name',
    //     message: 'What\'s your project name:',
    //     default: 'egg',
    //     when: false,
    //   },
    //   description: {
    //     type: 'input',
    //     name: 'description',
    //     message: 'What\'s your project description:',
    //     default: 'default desc',
    //   },
    // };
  }

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }
};
