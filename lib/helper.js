'use strict';

const runscript = require('runscript');
const debug = require('debug')('boilerplate:base');

exports.execForResult = async cmd => {
  try {
    const { stdout } = await runscript(cmd, { silent: true, stdio: 'pipe' });
    return stdout && stdout.toString().trim();
  } catch (err) {
    /* istanbul ignore next */
    debug(`[boilerplate] run shell ${cmd} fail: ${err.message}`);
    /* istanbul ignore next */
    return '';
  }
};

exports.exec = runscript;
exports.parseGitUrl = require('git-url-parse');
exports.hostedGitInfo = require('hosted-git-info');
