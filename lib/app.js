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
const mainFile = require.main.filename;
let appRoot = process.cwd();
if (mainFile.indexOf('launcher.js') < 0) {
  const pathArray = mainFile.split('/');
  pathArray.pop();
  appRoot = pathArray.join('/');
}
// 判斷Mahudas是怎麼被啟動的
// standalone表示直接執行(開發階段)
// framework表示是被安裝成package
let startMode = 'standalone';
if (__dirname.indexOf('/node_modules/') > 0
|| __dirname.indexOf(appRoot) < 0
) startMode = 'framework';

app.appInfo = {
  root: appRoot,
  startMode,
};

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
