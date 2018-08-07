'use strict';

const BaseBoilerplate = require('../../../index');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  initQuestions() { return []; }

  async run(context) {
    const { locals, argv } = context;
    locals.baseDir = argv.baseDir;
    return super.run(context);
  }
};
