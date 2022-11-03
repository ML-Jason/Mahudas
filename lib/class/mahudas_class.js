/* eslint no-console:0 */
const path = require('path');
const Koa = require('koa');
const koaStatic = require('koa-static');
const Router = require('koa-router');
const v8 = require('v8');
const gracefulShutdown = require('../graceful_shutdown');
const AppContainer = require('./app_container_class');
const coreMiddlewareConfigLoader = require('../loader/core_middleware_config_loader');
const BaseContext = require('./base_context_class');

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';
process.env.APP_ENV = process.env.APP_ENV || 'dev';
console.log(`\x1B[36m▉ NODE_ENV=${process.env.NODE_ENV}\x1B[0m`);
console.log(`\x1B[36m▉ APP_ENV=${process.env.APP_ENV}\x1B[0m`);

class Mahudas extends Koa {
  constructor(options = {}) {
    const defaultOptions = { proxy: true, env: process.env.NODE_ENV };
    super({ ...defaultOptions, ...options });

    // 套用graceful shutdown
    // 當process要停止前，先發送並等待beforeClose事件
    gracefulShutdown(this);

    // 取得appRoot
    let appRoot = process.cwd();
    if (!options.root) {
      const mainFile = require.main.filename;
      if (mainFile.indexOf('launcher.js') < 0) {
        const pathArray = mainFile.split('/');
        pathArray.pop();
        appRoot = pathArray.join('/');
      }
    } else {
      appRoot = path.resolve(options.root);
    }
    // 判斷Mahudas是怎麼被啟動的
    // standalone表示直接執行(開發階段)
    // framework表示是被安裝成package
    let startMode = 'standalone';
    if (!options.startMode) {
      if (__dirname.indexOf('/node_modules/') > 0
        || __dirname.indexOf(appRoot) < 0
      ) startMode = 'framework';
    } else {
      startMode = options.startMode;
    }

    this.appInfo = {
      root: appRoot,
      startMode,
    };

    this.router = new Router();
    this.controller = {};

    this.CLASSES = {
      BaseContext,
    };
    // 將app放置到global裡，以方便單獨使用
    global.app = this;

    // 開始載入application結構
    process.nextTick(() => {
      this.loadApp();
    });
  }

  async loadApp() {
    const appContainer = new AppContainer(this, this.appInfo.root);
    this.mainApp = appContainer;

    appContainer.loadConfig();
    this.emit('configDidLoad');

    // 套用coreMiddleware的設定
    coreMiddlewareConfigLoader(this);

    // 讓application載入其他功能
    appContainer.loadService();
    appContainer.loadExtend();
    appContainer.loadMiddleware();
    appContainer.loadRouter();

    // 結構載入完成，發送並等待didLoad事件
    // 讓其他plugin有時間在主機啟動前有機會進行介入
    await Promise.all(this.listeners('didLoad').map((v) => v()));
    this.startServer();
  }

  startServer() {
    this
      .use(this.router.routes())
      .use(this.router.allowedMethods());
    // 設定public目錄
    this.use(koaStatic(path.join(this.appInfo.root, (this.config.static || {}).dir || 'app/public')));

    // 如果startMode=mount
    // 表示Mahudas是掛載到其他的web server之上，因此不啟動監聽
    if (this.appInfo.startMode !== 'mount') {
      // 啟動Server
      const port = this.config.port || 8080;
      this.server = this.listen(port);
      console.log(`\x1B[36m▉ serverDidReady, running on http://localhost:${port}\x1B[0m`);
    }

    const heapStatistics = v8.getHeapStatistics();
    const memoryInfo = {
      used_heap_size: `${heapStatistics.used_heap_size / (1024 * 1024)} Mb`,
      heap_size_limit: `${heapStatistics.heap_size_limit / (1024 * 1024)} Mb`,
    };
    console.log('\x1B[36m▉ Memory usage:\x1B[0m', memoryInfo);

    this.emit('serverDidReady');

    this.mainApp.loadSchedule();
  }

  getAppStructure() {
    const stru = this.mainApp.getAppStructure();
    return stru;
  }
}

module.exports = Mahudas;