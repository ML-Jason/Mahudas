/* eslint global-require:0, import/no-dynamic-require:0, no-console:0 */
const path = require('path');
const fs = require('fs');
const extend = require('extend2');
const Loader = require('../loader');
const BaseService = require('./base_service_class');

class AppContainer {
  /**
   * 建構子傳入rootPath，指向目前這個application的根目錄
   * AppContainer將會以這個rootPath為起點，載入這個目錄之下的結構
   * mainApp(最外層的應用App)初始化時，會先將Mahudas push到subApps成為第一個subApp
   * 然後才會依序載入plugin，每個plugin都被視為是一個subApp
   */
  constructor(app, rootPath, name) {
    this.app = app;
    this.rootPath = rootPath;
    this.subApps = [];
    this.isMainApp = false;
    this.name = name;
    this.loader = new Loader(app);

    // 用rootPath來判斷是否是最外層的app，
    // 如果是的話，將isMainApp設為true(之後會用到)
    // 判斷如果app不是Mahudas自行啟動的，就建立一個Mahudas的AppContainer放到subApps裡
    // (因為Mahudas本身也需要載入自己的一些設定)
    if (rootPath === app.appInfo.root) {
      this.isMainApp = true;
      this.name = 'Main';
      const mahudasRoot = path.join(__dirname, '../..');
      if (rootPath !== mahudasRoot) {
        const mahudas = new AppContainer(app, path.join(__dirname, '../..'), 'MahudasCore');
        this.subApps.push(mahudas);
      } else {
        this.name = 'MahudasCore';
      }
    }
    // 試著載入application根目錄之下的app.js
    if (fs.existsSync(path.join(rootPath, 'app.js'))) {
      require(path.join(rootPath, 'app.js'))(app);
    }

    this.findPlugins();
  }

  // 依序往下收集config，最後與自己的config合併
  loadConfig() {
    let configs = {};
    this.subApps.forEach((subApp) => {
      configs = extend(true, configs, subApp.loadConfig());
    });
    configs = extend(true, configs, this.loader.loadConfig(this.rootPath));
    if (this.isMainApp) {
      this.app.config = configs;
    }
    return configs;
  }

  // 尋找config/plugin.env.js，判斷是否需要載入plugin
  // 如果需要載入並且plugin存在，就產生一個新的AppContainer來裝載
  findPlugins() {
    const pluginConfig = this.loader.loadConfig(this.rootPath, true);
    Object.entries(pluginConfig).forEach(([key, v]) => {
      if (v.enable === true) {
        let pluginPath;

        if (v.package) {
          // 如果是package，將載入路徑指向root/node_modules
          pluginPath = path.join(this.app.appInfo.root, 'node_modules', v.package);
          // 如果是在本機上進行開發並且用file的方式npm安裝
          // 路徑可能不會是主環境的node_modules，而是該subApp根目錄下的node_modules
          // 因此在這邊判斷，如果root/node_modules裡沒有該package，則到subApp的根目錄下尋找
          // 真的沒有就不載入
          if (!fs.existsSync(pluginPath)) {
            pluginPath = path.join(this.rootPath, 'node_modules', v.package);
          }
        }
        if (v.path) {
          pluginPath = path.join(this.rootPath, v.path);
        }

        if (fs.existsSync(pluginPath)) {
          this.app.logger.info(`\x1B[36m▉ Loading plugin:${key}\x1B[0m`);
          const plugin = new AppContainer(this.app, pluginPath, key);
          this.subApps.push(plugin);
        } else {
          // 路徑不存在就拋出錯誤，停止程序
          throw new Error(`Plugin "${key}" path not exist.`);
        }
      }
    });
  }

  loadService() {
    // 因為app.service的實體化以及ctx.service的getter不能重複定義
    // 因此appContainer.loadService()只會將讀取到的service定義資料回傳
    // 最後再從mainApp來進行ctx getter的設定

    // 取得所有subApps的service，與自己合併，回傳合併後的service
    let serviceDefs = [];
    this.subApps.forEach((subApp) => {
      const subservices = subApp.loadService();
      serviceDefs = [...serviceDefs, ...subservices];
    });
    const myservices = this.loader.loadService(this.rootPath);
    serviceDefs = [...serviceDefs, ...myservices];

    // 如果是mainApp，則將service注入到app及ctx裡
    if (this.isMainApp) {
      const serviceMap = new Map();
      serviceDefs.forEach((servicDef) => {
        const loaded = require(servicDef.path);
        serviceMap.set(servicDef.nameSpace, loaded);
      });

      // 擴充app.context，加入service這個getter，當ctx被實體化並讀取service時
      // 就會產生一個新的BaseService
      Object.defineProperty(this.app.context, 'service', {
        get() {
          if (this.serviceCacheInstance) return this.serviceCacheInstance;
          const instance = new BaseService({ ctx: this, subModules: serviceMap });
          this.serviceCacheInstance = instance;
          return instance;
        },
      });
    }
    return serviceDefs;
  }

  loadExtend() {
    this.subApps.forEach((subApp) => {
      subApp.loadExtend();
    });
    this.loader.loadExtend(this.rootPath);
  }

  loadMiddleware() {
    this.subApps.forEach((subApp) => {
      subApp.loadMiddleware();
    });
    this.loader.loadMiddleware(this.rootPath);
  }

  // controller及router只有在主應用才會生效
  // 因此不命令subApps去載入
  loadController() {
    this.loader.loadController(this.rootPath);
  }

  loadRouter() {
    this.loader.loadRouter(this.rootPath);
  }

  loadSchedule() {
    this.loader.loadSchedule(this.rootPath);
  }

  loadCoreMiddleware() {
    this.loader.loadCoreMiddleware();
  }

  loadFileLogger(transports) {
    transports.map((transport) => this.app.logger.add(transport));
  }

  getAppStructure() {
    const stru = {
      name: this.name,
      root: this.rootPath,
      subApps: [],
    };
    this.subApps.forEach((sub) => {
      const subStru = sub.getAppStructure();
      stru.subApps.push(subStru);
    });

    return stru;
  }
}

module.exports = AppContainer;
