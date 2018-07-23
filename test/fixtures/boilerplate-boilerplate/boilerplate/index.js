'use strict';

const CommonBoilerplate = require('common-boilerplate');

module.exports = class MainBoilerplate extends CommonBoilerplate {
  constructor(...args) {
    super(...args);
    this.questions.push({
      name: 'test',
      type: 'input',
      message: 'Some Question:',
    });
  }
  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }
};
