'use strict';

const fs = require('fs');
const is = require('is-type-of');
const isMatch = require('lodash.ismatch');
const Rule = require('coffee').Rule;

class FileRule extends Rule {
  // expect('file', 'package.json')
  // expect('file', 'package.json', { name: 'example' })
  // expect('file', 'README', /x = y/)
  // expect('file', 'README', [ /x = y/, /\d+/ ])
  assert(actual, expected, message) {
    const { file, pattern } = expected;

    // only check file exists if `pattern` is not provided
    if (pattern === undefined) {
      message = `file \`${file}\` should ${this.isOpposite ? 'not ' : ''}exists `;
      return super.assert(fs.existsSync(file), true, message);
    }

    // whether file is exists before check pattern
    // `notExpectFile('README', /name/)` is treat as require file exists
    super.assert(fs.existsSync(file), !this.isOpposite, `file \`${file}\` should exists before check ${this.isOpposite ? 'opposite ' : ''}rule \`${this.inspectObj(pattern)}\``);

    // read file content with cache
    let content = actual[file];
    if (!content) {
      content = actual[file] = fs.readFileSync(file, 'utf-8');
    }

    // check pattern list
    for (const p of [].concat(pattern)) {
      if (is.string(p)) {
        // if pattern is `string`, then test `includes`
        message = `file \`${file}\` should ${this.isOpposite ? 'not ' : ''}includes \`${this.inspectObj(p)}\` with content \`${this.inspectObj(content)}\``;
        super.assert(content.includes(p), true, message);
      } else if (is.regexp(p)) {
        message = `file \`${file}\` should ${this.isOpposite ? 'not ' : ''}match rule \`${this.inspectObj(p)}\` with content \`${this.inspectObj(content)}\``;
        super.assert(content, p, message);
      } else {
        // if pattern is `json`, then convert content to json and check whether contains pattern
        content = JSON.parse(content);
        message = `file \`${file}\` should ${this.isOpposite ? 'not ' : ''}match rule \`${this.inspectObj(p)}\` with content \`${this.inspectObj(content)}\``;
        super.assert(isMatch(content, p), true, message);
      }
    }
  }

  formatMessage(actual, expected, message) {
    return message;
  }

  inspectObj(obj) {
    const type = {}.toString.call(obj).replace(/^\[object (.*)\]$/, '$1');
    // escape \n to \\n for good view in terminal
    if (is.string(obj)) obj = obj.replace(/\n/g, '\\n');
    // stringify if object
    if (!is.regexp(obj) && is.object(obj)) obj = JSON.stringify(obj);
    return `${obj}(${type})`;
  }
}

module.exports = FileRule;
