'use strict';

const runscript = require('runscript');
const debug = require('debug')('boilerplate:base');

/**
 * try to find user name, email from `.npmrc` or `.gitconfig`
 * @return {Object} user info { name, email }
 */
exports.getUserMeta = () => {
  return {};
};

exports.getShellResult = async cmd => {
  try {
    const { stdout } = await runscript(cmd, { silent: true, stdio: 'pipe' });
    return stdout && stdout.toString().trim();
  } catch (err) {
    debug(`[boilerplate] run shell ${cmd} fail: ${err.message}`);
    return '';
  }
};

