'use strict';

const fs = require('fs');
const isMatch = require('lodash.ismatch');
const is = require('is-type-of');
const Rule = require('coffee').Rule;

class JSONRule extends Rule {
  // expect('json', 'package.json', { name: 'example' })
  assert(actual, expected, message) {
    const { file, pattern } = expected;

    // only check file exists
    if (pattern === undefined) {
      message = `file \`${file}\` should ${this.isOpposite ? 'not ' : ''}exists `;
      return super.assert(fs.existsSync(file), true, message);
    }

    // check file exists before rule
    super.assert(fs.existsSync(file), !this.isOpposite, `file \`${file}\` should exists before check ${this.isOpposite ? 'opposite ' : ''}rule \`${this.inspectObj(pattern)}\``);

    let content = actual[file];
    if (!content) {
      content = actual[file] = JSON.parse(fs.readFileSync(file, 'utf-8'));
    }

    for (const p of [].concat(pattern)) {
      message = `file \`${file}\` should ${this.isOpposite ? 'not ' : ''}match rule \`${this.inspectObj(p)}\` with content \`${this.inspectObj(content)}\``;
      super.assert(isMatch(content, p), true, message);
    }
  }

  formatMessage(actual, expected, message) {
    return message;
  }

  inspectObj(obj) {
    const type = {}.toString.call(obj).replace(/^\[object (.*)\]$/, '$1');
    if (is.buffer(obj)) obj = obj.toString();
    // escape \n to \\n for good view in terminal
    if (is.string(obj)) obj = obj.replace(/\n/g, '\\n');
    // stringify if object
    if (!is.regexp(obj) && is.object(obj)) obj = JSON.stringify(obj);
    return `${obj}(${type})`;
  }
}

module.exports = JSONRule;
