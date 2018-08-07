'use strict';

const fs = require('fs');
const isMatch = require('lodash.ismatch');
const Rule = require('coffee').Rule;

class JSONRule extends Rule {
  // expect('json', 'package.json', { name: 'example' })
  assert(actual, expected, message) {
    const { file, pattern } = expected;

    // check file exists
    message = `file \`${file}\` should ${this.isOpposite ? 'not ' : ''}exists `;
    super.assert(fs.existsSync(file), true, message);

    let content = actual[file];
    if (!content) {
      content = actual[file] = JSON.parse(fs.readFileSync(file, 'utf-8'));
    }

    for (const p of [].concat(pattern)) {
      message = `file \`${file}\` should ${this.isOpposite ? 'not ' : ''}match rule \`${JSON.stringify(p)}\` with content \`${JSON.stringify(content)}\``;
      super.assert(isMatch(content, p), true, message);
    }
  }

  formatMessage(actual, expected, message) {
    return message;
  }
}

module.exports = JSONRule;
