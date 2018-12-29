'use strict';

const runscript = require('runscript');
const debug = require('debug')('boilerplate:base');

exports.exec = async cmd => {
  try {
    const { stdout } = await runscript(cmd, { silent: true, stdio: 'pipe' });
    return stdout && stdout.toString().trim();
  } catch (err) {
    /* istanbul ignore next */
    debug(`[boilerplate] run shell ${cmd} fail: ${err.message}`);
    return '';
  }
};
