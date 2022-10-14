/**
 * 程式進入點
 */

const path = require('path');
const koaStatic = require('koa-static');
const v8 = require('v8');
const configLoader = require('./lib/loader/config_loader');
const coreMiddlewareConfigLoader = require('./lib/loader/core_middleware_config_loader');
const controllerLoader = require('./lib/loader/controller_loader');
const middlewareLoader = require('./lib/loader/middleware_loader');
const routerLoader = require('./lib/loader/router_loader');
const serviceLoader = require('./lib/loader/service_loader');
const extendLoader = require('./lib/loader/extend_loader');

require('./lib/console');

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';
process.env.APP_ENV = process.env.APP_ENV || 'dev';

const app = require('./lib/app');

const init = async () => {
  // 載入config
  app.config = configLoader(app.appInfo);
  app.emit('configDidLoad');

  // 載入框架預設 middleware
  coreMiddlewareConfigLoader(app);

  // 載入application
  await controllerLoader(app);
  await middlewareLoader(app);
  await routerLoader(app);
  await serviceLoader(app);
  await extendLoader(app);
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

  const heapStatistics = v8.getHeapStatistics();
  const memoryInfo = {
    used_heap_size: `${heapStatistics.used_heap_size / (1024 * 1024)} Mb`,
    heap_size_limit: `${heapStatistics.heap_size_limit / (1024 * 1024)} Mb`,
  };
  console.log('Memory usage:', memoryInfo);
};

init();
