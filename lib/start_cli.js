#!/usr/bin/env node

'use strict';

const baseDir = process.env.TEST_UTILS_BASE_DIR;
delete process.env.TEST_UTILS_BASE_DIR;

const Command = require(baseDir);

new Command().start();
