'use strict';

const BaseBoilerplate = require('../../../index');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async run(context) {
    const { locals, argv } = context;
    locals.baseDir = argv.baseDir;
    console.log(`one context: ${context === this.context}`);
    return super.run(context);
  }
};
