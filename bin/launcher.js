#!/usr/bin/env node

/* eslint global-require:0, import/no-dynamic-require:0 */
const fs = require('fs-extra');

require(`${process.cwd()}/node_modules/mahudas/index.js`);
if (fs.existsSync(`${process.cwd()}/app.js`)) require(`${process.cwd()}/app.js`);
