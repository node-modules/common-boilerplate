'use strict';

const BaseBoilerplate = require('../normal');

module.exports = class TestBoilerplate extends BaseBoilerplate {

  get [Symbol.for('boilerplate#root')]() {
    return __dirname;
  }

  initQuestions() {
    const questions = super.initQuestions();

    // change parent question
    const q = questions.filter(x => x.name === 'author')[0];
    q.default = 'egg';

    questions.push({
      type: 'input',
      name: 'another',
      message: 'Another question:',
    });

    return questions;
  }

  async listFiles(...args) {
    const files = await super.listFiles(...args);
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
