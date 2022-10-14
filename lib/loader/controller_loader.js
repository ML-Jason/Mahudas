/* eslint global-require:0, import/no-dynamic-require:0 */

/**
 * 用來自動載入 controller 的loader
 * 載入的模組會被注入到app.controller
 */

const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const toCamelCase = require('../to_camel_case');

/**
  * 遍尋目錄下的所有檔案
  * 將名稱與路徑儲存在一個物件中
  */
const recursiveSearch = async (dirPath) => {
  const modules = {};
  try {
    const directX = fs.readdirSync(dirPath);
    await async.eachSeries(directX, async (pName) => {
      const currentPath = path.join(dirPath, pName);
      const targetFS = fs.statSync(currentPath);
      const mName = toCamelCase(pName.replace(/\.js$/, ''));

      // 如果命名是"-"開頭，就忽略
      if (mName.indexOf('-') === 0) return;

      if (targetFS.isDirectory()) {
        modules[mName] = await recursiveSearch(currentPath);
      } else {
        modules[mName] = currentPath;
      }
    });
  } catch (e) { /** */ }
  return modules;
};

/**
  * 利用recursiveSearch得到的物件
  * 載入模組並注入到app相對應的變數中
  */
const recursiveInject = (moduleMap, scopeName, app) => {
  if (Object.keys(moduleMap).length === 0) return;
  let module = app.controller;
  /**
    * 將 a.b 的scopeName轉換成
    * {
    *   a: {
    *     b: {}
    *   }
    * }
    * 的物件型態
    */
  if (scopeName !== '') {
    const names = scopeName.split('.');
    while (names.length > 0) {
      if (!module[names[0]]) module[names[0]] = {};
      module = module[names[0]];
      names.shift();
    }
  }
  Object.keys(moduleMap).forEach((moduleName) => {
    const rdata = moduleMap[moduleName];
    if (typeof rdata === 'string') {
      const loadedModule = require(rdata);
      module[moduleName] = loadedModule;
    } else {
      recursiveInject(rdata, `${scopeName}.${moduleName}`.replace(/^\./, ''), app);
    }
  });
};

const run = async (app) => {
  const appRoot = app.appInfo.root;

  // 定義要掃描的目錄名稱，依序掃描並載入
  const scanPath = path.join(appRoot, 'app', 'controller');
  const modules = await recursiveSearch(scanPath);
  recursiveInject(modules, '', app);
};

module.exports = run;
