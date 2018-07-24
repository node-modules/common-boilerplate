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

    // change parent question
    const q = this.questions.filter(x => x.name === 'author')[0];
    q.default = 'egg';
  }

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  async listFiles() {
    const files = await super.listFiles();
    files['github.png'] = undefined;
    return files;
  }

  async saveFile({ fileInfo }) {
    if (fileInfo.isText && fileInfo.key !== 'package.json') {
      fileInfo.content = fileInfo.content.replace(/\begg-mock\b/g, '@ali/mm');
    }
    return await super.saveFile({ fileInfo });
  }
};
