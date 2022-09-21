/* eslint global-require:0, import/no-dynamic-require:0, no-param-reassign:0, no-multi-assign:0 */

const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const toCamelCase = require('../to_camel_case');

/**
 * 將serviceClass儲存在app.serviceClasses中
 * 複寫app.createContext
 */
const loadToApp = async (modules, app) => {
  const { BaseContextClass } = global.app.CLASSES;

  // 將class儲存到app.serviceClasses裡
  const { serviceClasses } = app;
  await async.eachSeries(modules, async (module) => {
    const loaded = require(module.path);
    // serviceClasses[module.nameSpace] = loaded;
    serviceClasses.set(module.nameSpace, loaded);
  });
  // 讓app.service可以直接實體化instance(省略eggjs的createAnonymousContext)
  app.service = new BaseContextClass(null, serviceClasses);

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

    context.service = new BaseContextClass(context, serviceClasses);
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
