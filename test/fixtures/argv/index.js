'use strict';

const BaseBoilerplate = require('../../../index');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async run(context) {
    console.log(`one context: ${context === this.context}`);
    return super.run(context);
  }

  async initLocals() {
    const locals = await super.initLocals();
    locals.baseDir = this.context.argv.baseDir;
    return locals;
  }

  initQuestions() {
    return [
      {
        name: 'name',
        type: 'input',
        message: 'Project Name: ',
      },
      {
        name: 'description',
        type: 'input',
        message: 'Description:',
      },
    ];
  }
};
