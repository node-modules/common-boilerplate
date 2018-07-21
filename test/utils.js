'use strict';

const Coffee = require('coffee').Coffee;

// https://github.com/popomore/coffee
class CliCoffee extends Coffee {
  constructor(...args) {
    super(...args);
    this.prompts = [];
  }

  prompt(input) {
    this.prompts.push(input);
    return this;
  }

  _run() {
    const res = super._run();
    this.proc.on('message', ({ type }) => {
      if (type !== 'prompt') return;
      const key = this.prompts.shift();
      this.proc.stdin.write(key + '\n');
    });
    return res;
  }

  restore() {
    this.prompts = [];
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
