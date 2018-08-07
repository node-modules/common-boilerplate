'use strict';

const fs = require('fs');
const Rule = require('coffee').Rule;

class FileRule extends Rule {
  // expect('file', 'package.json')
  // expect('file', 'README', /x = y/)
  // expect('file', 'README', [ /x = y/, /\d+/ ])
  assert(actual, expected, message) {
    const { file, pattern } = expected;

    // check file exists
    message = `file \`${file}\` should ${this.isOpposite ? 'not ' : ''}exists `;
    super.assert(fs.existsSync(file), true, message);

    // check file exists
    if (pattern === undefined) return;

    let content = actual[file];
    if (!content) {
      content = actual[file] = fs.readFileSync(file, 'utf-8');
    }

    for (const p of [].concat(pattern)) {
      message = `file \`${file}\` should ${this.isOpposite ? 'not ' : ''}match rule \`${this.inspectObj(p)}\` with content \`${this.inspectObj(content)}\``;
      super.assert(content, p, message);
    }
  }

  formatMessage(actual, expected, message) {
    return message;
  }
}

module.exports = FileRule;
