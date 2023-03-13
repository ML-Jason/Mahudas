/* eslint no-console:0 */
const path = require('path');
const Koa = require('koa');
const koaStatic = require('koa-static');
const Router = require('koa-router');
const v8 = require('v8');
const http = require('http');
const gracefulShutdown = require('../graceful_shutdown');
const AppContainer = require('./app_container_class');
const BaseService = require('./base_service_class');
const logger = require('../logger');

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';
process.env.APP_ENV = process.env.APP_ENV || 'dev';

class Mahudas extends Koa {
  constructor(options = {}) {
    const defaultOptions = { proxy: true, env: process.env.NODE_ENV };
    super({ ...defaultOptions, ...options });

    this.coreLogger = logger({}, 'core').Logger;

    this.coreLogger.info(`\x1B[36m▉ NODE_ENV=${process.env.NODE_ENV}\x1B[0m`);
    this.coreLogger.info(`\x1B[36m▉ APP_ENV=${process.env.APP_ENV}\x1B[0m`);

    // 套用graceful shutdown
    // 當process要停止前，先發送並等待beforeClose事件
    gracefulShutdown(this);

    // 取得appRoot
    let appRoot = process.cwd();
    if (!options.root) {
      const mainFile = require.main.filename;
      if (mainFile.indexOf('launcher.js') < 0) {
        const pathArray = mainFile.split(path.sep);
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
    this.schedule = {};

    this.CLASSES = {
      BaseService,
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

    const { Logger, Transports, Format } = logger(this);
    this.logger = Logger;
    this.logger.Transports = Transports;
    this.logger.Format = Format;

    // 套用coreMiddleware的設定
    appContainer.loadCoreMiddleware();

    // 讓application載入其他功能
    appContainer.loadService();
    appContainer.loadExtend();
    appContainer.loadMiddleware();
    appContainer.loadController();
    appContainer.loadRouter();

    appContainer.loadSchedule();

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
      this.coreLogger.info(`\x1B[36m▉ serverDidReady, running on http://localhost:${port}\x1B[0m`);
    }

    const heapStatistics = v8.getHeapStatistics();
    const memoryInfo = {
      used_heap_size: `${heapStatistics.used_heap_size / (1024 * 1024)} Mb`,
      heap_size_limit: `${heapStatistics.heap_size_limit / (1024 * 1024)} Mb`,
    };

    this.coreLogger.info('\x1B[36m▉ Memory usage:\x1B[0m', memoryInfo);

    this.emit('serverDidReady');
  }

  getAppStructure() {
    return this.mainApp.getAppStructure();
  }

  newContext(req) {
    const request = {
      headers: {
        host: '127.0.0.1',
        'x-forwarded-for': '127.0.0.1',
      },
      query: {},
      querystring: '',
      host: '127.0.0.1',
      hostname: '127.0.0.1',
      protocol: 'http',
      secure: 'false',
      method: 'GET',
      url: '/',
      path: '/',
      socket: {
        remoteAddress: '127.0.0.1',
        remotePort: this.config.port || 8080,
      },
    };
    if (req) {
      Object.keys(req).forEach((key) => {
        if (key === 'headers' || key === 'query' || key === 'socket') {
          Object.assign(request[key], req[key]);
        } else {
          request[key] = req[key];
        }
      });
    }
    const response = new http.ServerResponse(request);
    return this.createContext(request, response);
  }

  // 發出uncaughtExcption事件並等待完成
  async onUncaughtException(err) {
    await Promise.all(this.listeners('uncaughtException').map((v) => v(err)));
  }

  async close() {
    await Promise.all(this.listeners('beforeClose').map((v) => v()));
    this.removeAllListeners('beforeClose');

    try {
      this.server.close();
    } catch (e) { /** */ }
  }
}

module.exports = Mahudas;
