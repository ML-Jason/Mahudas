/* eslint global-require:0, import/no-dynamic-require:0 */

/**
 * 用來自動載入 controller, middleware, router, service, model 的loader
 * 類似eggjs，載入的模組會被注入到app裡(router例外，router不需要被重複使用)
 * 唯一的差別是middleware，因為原生的koa在app裡已經有一個middleware的property，
 * 因此被Mahodas載入的middleware會被注入到app.middlewares裡
 */

const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const toCamelCase = require('./to_camel_case');

/**
 * 遍尋目錄下的所有檔案
 * 將名稱與路徑儲存在一個物件中
 */
const recusiveSearch = async (dirpath) => {
  const modules = {};
  try {
    const dirctx = fs.readdirSync(dirpath);
    await async.eachSeries(dirctx, async (pname) => {
      const currentpath = path.join(dirpath, pname);
      const targetfs = fs.statSync(currentpath);
      const mname = toCamelCase(pname.replace(/\.js$/, ''));
      if (targetfs.isDirectory()) {
        const submodules = await recusiveSearch(currentpath);
        modules[mname] = submodules;
      } else {
        modules[mname] = currentpath;
      }
    });
  } catch (e) { /** */ }
  return modules;
};

/**
 * 利用recusiveSearch得到的物件
 * 載入router
 */
const recusiveRouter = (moduleMap, app) => {
  Object.keys(moduleMap).forEach((modulename) => {
    const rdata = moduleMap[modulename];
    if (typeof rdata === 'string') {
      require(rdata)(app);
    } else {
      recusiveRouter(rdata, app);
    }
  });
};

/**
 * 利用recusiveSearch得到的物件
 * 載入模組並注入到app相對應的變數中
 */
const recusiveInject = (moduleMap, scopename, moduleType, app) => {
  if (Object.keys(moduleMap).length === 0) return;
  let mtype = moduleType;
  // middleware要被注入到app.middlewares裡
  if (mtype === 'middleware') mtype = 'middlewares';
  let module = app[mtype];
  if (scopename !== '') {
    const names = scopename.split('.');
    while (names.length > 0) {
      if (!module[names[0]]) module[names[0]] = {};
      module = module[names[0]];
      names.shift();
    }
  }
  Object.keys(moduleMap).forEach((modulename) => {
    const rdata = moduleMap[modulename];
    if (typeof rdata === 'string') {
      const loadedModule = require(rdata);
      if (moduleType === 'middleware') {
        module[modulename] = loadedModule(app);
      } else {
        module[modulename] = loadedModule;
      }
    } else {
      recusiveInject(rdata, `${scopename}.${modulename}`.replace(/^\./, ''), moduleType, app);
    }
  });
};

const run = async (app) => {
  const appRoot = app.appInfo.root;

  // 定義要掃描的目錄名稱，依序掃描並載入
  const scanDirs = ['controller', 'middleware', 'router', 'service', 'model'];
  await async.eachSeries(scanDirs, async (dirname) => {
    const scanPath = path.join(appRoot, 'app', dirname);
    const modules = await recusiveSearch(scanPath);
    if (dirname === 'router') {
      recusiveRouter(modules, app);
    } else {
      recusiveInject(modules, '', dirname, app);
    }
  });
};

module.exports = run;
