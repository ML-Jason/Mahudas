/* eslint global-require:0, import/no-dynamic-require:0 */

/**
 * 初使化Koa
 */
const Koa = require('koa');
const Router = require('koa-router');
const helmet = require('koa-helmet');
const bodyParser = require('koa-bodyparser');

const app = new Koa({ proxy: true });

// 處理graceful shutdown
require('./graceful_shutdown')(app);

// 取得appRoot
const _mainfile = require.main.filename;
let _appRoot = process.cwd();
if (_mainfile.indexOf('launcher.js') < 0) {
  const _patharray = _mainfile.split('/');
  _patharray.pop();
  _appRoot = _patharray.join('/');
}

app.appInfo = { root: _appRoot };

// 載入app.js
try {
  require(`${app.appInfo.root}/app.js`)(app);
} catch (e) { /* */ }

/**
 * 初始koa-router實體，並注入到app
 * https://github.com/ZijianHe/koa-router
 */
const router = new Router();
app
  .use(router.routes())
  .use(router.allowedMethods());
app.router = router;
app.controller = {};
app.middlewares = {};
app.service = {};
app.model = {};

/**
 * 掛載bodyParser
 * 將接收的檔案大小拉高到100mb
 */
app.use(bodyParser({
  jsonLimit: '100mb',
  textLimit: '100mb',
}));

/**
 * 使用helmet進行基本的安全性保護。
 * https://www.npmjs.com/package/koa-helmet
 * 關閉helmet的CSP，否則很多js會無法運作。
 * 設定referrerPolicy為'no-referrer-when-downgrade'，否則有時會有些script或圖片出現錯誤。
 * 關閉crossOriginEmbedderPolicy，否則html會無法引用第三方js。
 */
app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
  crossOriginEmbedderPolicy: false,
}));

// 將app放置到global裡，以方便單獨使用
global.app = app;

module.exports = app;
