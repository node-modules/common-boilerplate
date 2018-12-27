#!/usr/bin/env node

'use strict';

const Command = require('..');

const instance = new Command();

const originFn = instance.helper.exec;
instance.helper.exec = async function(cmd) {
  if (cmd === 'tnpm -v') return '';
  if (cmd === 'cnpm -v') return 'cnpm@6.0.0';
  return originFn.call(instance.helper, cmd);
};

instance.start();
