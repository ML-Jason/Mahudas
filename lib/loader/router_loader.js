/* eslint global-require:0, import/no-dynamic-require:0 */

/**
 * 用來自動載入 router 的loader
 */

const fs = require('fs');
const path = require('path');
const toCamelCase = require('../to_camel_case');

/**
  * 遍尋目錄下的所有檔案
  * 將名稱與路徑儲存在一個物件中
  */
const recursiveSearch = (dirPath) => {
  const modules = {};
  try {
    const directX = fs.readdirSync(dirPath);
    directX.forEach((pName) => {
      const currentPath = path.join(dirPath, pName);
      const targetFS = fs.statSync(currentPath);
      const mName = toCamelCase(pName.replace(/\.js$/, ''));

      // 如果命名是"-"開頭，就忽略
      if (mName.indexOf('-') === 0) return;

      if (targetFS.isDirectory()) {
        modules[mName] = recursiveSearch(currentPath);
      } else {
        modules[mName] = currentPath;
      }
    });
  } catch (e) { /** */ }
  return modules;
};

/**
  * 利用recursiveSearch得到的物件
  * 載入router
  */
const recursiveRouter = (moduleMap, app) => {
  Object.keys(moduleMap).forEach((moduleName) => {
    const rdata = moduleMap[moduleName];
    if (typeof rdata === 'string') {
      require(rdata)(app);
    } else {
      recursiveRouter(rdata, app);
    }
  });
};

const run = (app, rootPath) => {
  const scanPath = path.join(rootPath, 'app', 'router');
  const modules = recursiveSearch(scanPath);
  recursiveRouter(modules, app);
};

module.exports = run;
