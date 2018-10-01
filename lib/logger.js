'use strict';

const { Signale } = require('signale');

module.exports = class Logger extends Signale {

  _toggle(typeList, bool) {
    typeList = [].concat(typeList);
    for (const type of typeList) {
      if (!this._types[type]) throw new Error(`logger don't not has type: ${type}`);
      this._types[type].disabled = !bool;
    }
  }

  enable(type) {
    if (!type) return super.enable();
    this._toggle(type, true);
  }

  disable(type) {
    if (!type) return super.disable();
    this._toggle(type, false);
  }

  _logger(type, ...messageObj) {
    if (this._types[type].disabled) return;
    return super._logger(type, ...messageObj);
  }
};
