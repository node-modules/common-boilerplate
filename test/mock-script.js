'use strict';

const inquirer = require('inquirer');

/**
 * stub inquirer, auto answer `actions`
 * @param {Array} actions - key list
 */
module.exports = function mockInquirer(actions) {
  if (!Array.isArray(actions)) actions = [].concat(actions);
  // stub inquirer
  const originPrompt = inquirer.prompt;
  inquirer.prompt = (questions, cb) => {
    if (!Array.isArray(questions)) questions = [].concat(questions);

    const task = originPrompt.call(inquirer, questions, cb);
    let sendCount = 0;

    // will trigger after each prompt result
    task.ui.process.subscribe(() => {
      // only auto answer if current questions list is not finish
      if (sendCount < questions.length) {
        sendKey(actions.shift());
        sendCount++;
      }

      // restore origin prompt when actions is empty
      if (actions.length === 0) {
        inquirer.prompt = originPrompt;
        return;
      }
    });

    // send first key
    sendKey(actions.shift());
    sendCount++;

    return task;
  };
};

/**
 * send key to `process.stdin`
 *
 * @param {String} key - key str
 */
function sendKey(key) {
  process.nextTick(() => {
    process.stdin.emit('data', key + '\n');
  });
}

