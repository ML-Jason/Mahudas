/* eslint global-require:0, import/no-dynamic-require:0, no-param-reassign:0, no-multi-assign:0 */

const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const toCamelCase = require('../to_camel_case');

// 判斷要載入的service是否為Class
const typeofService = (service) => {
  if (typeof service === 'function') {
    if (service.prototype && service.prototype.constructor) {
      return 'class';
    }
    return 'function';
  }
  return 'object';
};

const serviceGetter = (app, ctx) => {
  const service = {};

  // 儲存instance的暫存，以nameSpace為key值儲存instance
  // 確保每個ctx階段不會產生兩個同樣service的instance
  const cache = {};

  // 在相對應的路徑下建立getter，實體化instance時將ctx給予instance
  Object.entries(app.serviceClasses).forEach(([nameSpace, serviceValue]) => {
    const scopes = nameSpace.split('.');
    let myName = scopes[0];
    // 建立巢狀的object
    let serviceModule = service;
    while (scopes.length > 1) {
      if (!serviceModule[scopes[0]]) serviceModule[scopes[0]] = {};
      serviceModule = serviceModule[scopes[0]];
      myName = scopes.shift();
    }

    // 實作getter，動態回傳service實體
    const getter = () => {
      // 判斷serviceValue是否為Class，是的話就new一個instance，否則就直接回傳
      const serviceType = typeofService(serviceValue);
      if (serviceType === 'class') {
        // 確認是否已經有cache，有的話回傳cache
        if (cache[nameSpace]) return cache[nameSpace];
        // 如果沒有instance的cache，就new一個service，並儲存到cache裡
        // eslint-disable-next-line
        const instance = new serviceValue(ctx);
        cache[nameSpace] = instance;
        return instance;
      }
      if (serviceType === 'function') {
        const instance = serviceValue(ctx);
        return instance;
      }
      return serviceValue;
    };

    Object.defineProperty(serviceModule, myName, { get: getter });
  });
  return service;
};
/**
 * 將serviceClass儲存在app.serviceClasses中
 * 複寫app.createContext
 */
const loadToApp = async (modules, app) => {
  // 將class儲存到app.serviceClasses裡
  const { serviceClasses } = app;
  await async.eachSeries(modules, async (module) => {
    const loaded = require(module.path);
    serviceClasses[module.nameSpace] = loaded;
  });
  // 讓app.service可以直接實體化instance(省略eggjs的createAnonymousContext)
  app.service = serviceGetter(app);

  // override app.createContext，將ctx加上service的getter
  app.createContext = (req, res) => {
    const context = Object.create(app.context);
    const request = context.request = Object.create(app.request);
    const response = context.response = Object.create(app.response);
    context.app = request.app = response.app = app;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.originalUrl = request.originalUrl = req.url;
    context.state = {};

    context.service = serviceGetter(app, context);
    return context;
  };
};

/**
 * 遍尋目錄下的所有檔案
 * 將名稱與路徑儲存在一個物件中，用來提供給loadApp後續使用
 */
const recursiveSearch = async (startPath, subPath = '') => {
  let modules = [];
  try {
    const scanPath = path.join(startPath, subPath);
    const directX = fs.readdirSync(scanPath, { withFileTypes: true });
    await async.eachSeries(directX, async (dirent) => {
      const currentPath = path.join(scanPath, dirent.name);
      if (dirent.isDirectory()) {
        const subModules = await recursiveSearch(startPath, path.join(subPath, dirent.name));
        modules = [...modules, ...subModules];
      } else {
        const nameSpace = currentPath
          .replace(/\.js$/, '')
          .replace(`${startPath}/`, '')
          .split('/')
          .map((v) => toCamelCase(v))
          .join('.');
        modules.push({
          nameSpace,
          path: currentPath,
        });
      }
    });
  } catch (e) { /** */ }
  return modules;
};

const run = async (app) => {
  const appRoot = app.appInfo.root;

  // 掃描service目錄
  const scanPath = path.join(appRoot, 'app', 'service');
  const modules = await recursiveSearch(scanPath);

  // 載入service
  await loadToApp(modules, app);
};

module.exports = run;
