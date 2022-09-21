/* eslint global-require:0, import/no-dynamic-require:0 */

/**
 * 初使化Koa
 */
const Koa = require('koa');
const Router = require('koa-router');
const BaseContextClass = require('./class/base_context_class');

const app = new Koa({ proxy: true, env: process.env.NODE_ENV });

// 處理graceful shutdown
require('./graceful_shutdown')(app);

// 取得appRoot
const _mainFile = require.main.filename;
let _appRoot = process.cwd();
if (_mainFile.indexOf('launcher.js') < 0) {
  const _pathArray = _mainFile.split('/');
  _pathArray.pop();
  _appRoot = _pathArray.join('/');
}

app.appInfo = { root: _appRoot };

// 載入app.js
try {
  require(`${app.appInfo.root}/app.js`)(app);
} catch (e) { /* */ }

app.CLASSES = {
  BaseContextClass,
};

/**
 * 初始koa-router實體，並注入到app
 * https://github.com/ZijianHe/koa-router
 */
const router = new Router();
app.router = router;
app.controller = {};
app.middlewares = {};
app.serviceClasses = new Map();

// 將app放置到global裡，以方便單獨使用
global.app = app;

module.exports = app;
