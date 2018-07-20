'use strict';

const path = require('path');
const Coffee = require('coffee').Coffee;

class CliCoffee extends Coffee {
  constructor(...args) {
    super(...args);
    this.promptActions = [];
    this.promptMockScript = path.join(__dirname, './mock-script.js');
  }

  mockPrompt(input) {
    this.promptActions.push(input);
    return this;
  }

  get _hookScripts() {
    const str = super._hookScripts;
    if (this.promptActions.length === 0) return str;

    const mockScript = `require('${this.promptMockScript}')(${JSON.stringify(this.promptActions)})`;
    return `${str || ''}\n\n${mockScript}`;
  }

  _run() {
    return super._run();
  }

  restore() {
    this.promptActions = [];
    return super.restore();
  }
}

exports.Coffee = CliCoffee;

exports.KEYS = {
  UP: '\u001b[A',
  DOWN: '\u001b[B',
  LEFT: '\u001b[D',
  RIGHT: '\u001b[C',
  ENTER: '\n',
  SPACE: ' ',
};

/**
 * fork a child process to test
 * @param {String} modulePath - The module to run in the child
 * @param {Array} args - List of string arguments
 * @param {Object} opt - fork options
 * @see https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options
 * @return {Coffee} coffee instance
 */
exports.fork = function(modulePath, args, opt) {
  return new CliCoffee({
    method: 'fork',
    cmd: modulePath,
    args,
    opt,
  });
};

/**
 * spawn a child process to test
 * @param  {String} cmd - The command to run
 * @param  {Array} args - List of string arguments
 * @param  {Object} opt - spawn options
 * @return {Coffee} coffee instance
 */
exports.spawn = function(cmd, args, opt) {
  return new CliCoffee({
    method: 'spawn',
    cmd,
    args,
    opt,
  });
};
