'use strict';

const Coffee = require('coffee').Coffee;

// https://github.com/popomore/coffee
class CliCoffee extends Coffee {
  waitForPrompt(bool) {
    this._isWaitForPrompt = bool !== false;
    return this;
  }

  _run() {
    if (this._isWaitForPrompt) {
      this.prompts = this.stdin;
      this.stdin = [];
    }
    const res = super._run();
    this.stdin = this.prompts;
    this.prompts = undefined;
    const cmd = this.proc;
    cmd.on('message', ({ type }) => {
      if (type !== 'prompt' || this.stdin.length === 0) return;
      const key = this.stdin.shift();
      cmd.stdin.write(key);
      if (this.stdin.length === 0) cmd.stdin.end();
    });
    return res;
  }

  restore() {
    this.prompts = [];
    this._isWaitForPrompt = false;
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
