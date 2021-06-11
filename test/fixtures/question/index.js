'use strict';

const BaseBoilerplate = require('../../..');

class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async askQuestions() {
    const prefix = this.locals.prefix || '';
    await this.askNpm({ prefix });

    const { name, scope, npm } = this.locals;
    const usage = `${npm} init ${scope}/${name.substring(prefix.length)}`;
    this.setLocals({ usage });

    this.setLocals(await this.prompt({
      name: 'npm_module',
      type: 'confirm',
      message: 'Is this a npm module for reuse?',
      default: true,
    }));

    await this.askGit();
  }
}

module.exports = TestBoilerplate;
