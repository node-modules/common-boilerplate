'use strict';

const BaseBoilerplate = require('../normal');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  constructor(...args) {
    super(...args);

    this.questions.push(
      {
        type: 'input',
        name: 'another',
        message: 'Another question:',
      }
    );
  }

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async listFiles() {
    const files = await super.listFiles();
    files['github.png'] = undefined;
    return files;
  }
};
