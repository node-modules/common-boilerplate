'use strict';

const BaseBoilerplate = require('../../..');

class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async initQuestions() {
    return [
      ...await super.initQuestions(),
      this.getBuiltinQuestions('scope'),
      this.getBuiltinQuestions('name'),
      this.getBuiltinQuestions('repository'),
      this.getBuiltinQuestions('description', { default: 'desc' }),
      this.getBuiltinQuestions('npm_module'),
    ];
  }
}

module.exports = TestBoilerplate;
