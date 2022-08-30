/**
 * 程式進入點
 */

const path = require('path');
const koaStatic = require('koa-static');
const configLoader = require('./lib/config_loader');
const applicationLoader = require('./lib/application_loader');
require('./lib/console');

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';
process.env.APP_ENV = process.env.APP_ENV || 'dev';

const app = require('./lib/app');

const init = async () => {
  // 載入config
  app.config = configLoader(app.appInfo);
  app.emit('configDidLoad');

  // 載入application
  await applicationLoader(app);
  app.emit('didLoad');

  // 讓router生效，這個步驟需要在所有app.use都掛載後才觸發，否則可能會造成middleware失效
  app
    .use(app.router.routes())
    .use(app.router.allowedMethods());
  // 設定public目錄
  app.use(koaStatic(path.join(app.appInfo.root, (app.config.static || {}).dir || 'app/public')));

  // 啟動Server
  const port = app.config.port || 8080;
  app.listen(port);
  console.log(`serverDidReady, Listening ${port}`);
  app.emit('serverDidReady');
};

init();
