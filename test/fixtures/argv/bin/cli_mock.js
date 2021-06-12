#!/usr/bin/env node

'use strict';

const Command = require('..');

const instance = new Command();

const originFn = instance.helper.execForResult;
instance.helper.execForResult = async function(cmd) {
  if (cmd === 'tnpm config get registry') return '';
  if (cmd === 'cnpm config get registry') return 'https://registry.npmjs.org';
  return originFn.call(instance.helper, cmd);
};

instance.start();
