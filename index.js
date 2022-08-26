/**
 * 程式進入點
 */

const path = require('path');
const koaStatic = require('koa-static');
const configLoader = require('./lib/config_loader');
const applicationLoader = require('./lib/application_loader');
require('./lib/console');
const app = require('./lib/app');

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';
process.env.APP_ENV = process.env.APP_ENV || 'dev';

// 載入config
app.config = configLoader(app.appInfo);

// 設定public目錄
app.use(koaStatic(path.join(app.appInfo.root, app.config.static.dir || 'app/public')));

// 載入application
applicationLoader(app);

// 啟動Server
const port = app.config.port || 8080;
app.listen(port);
console.log(`Listening ${port}`);

module.exports = app;
