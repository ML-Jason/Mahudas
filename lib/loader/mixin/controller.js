/* eslint global-require:0, import/no-dynamic-require:0, no-param-reassign:0 */

const path = require('path');

/**
 * 利用recursiveSearch得到的物件
 * 載入模組並注入到app相對應的變數中
 */
const recursiveInject = (modules, app) => {
  if (modules.length === 0) return;
  const { controller } = app;

  modules.forEach((module) => {
    const splitName = module.nameSpace.split('.');
    splitName.reduce((r, a, currentIndex) => {
      r[a] = r[a] || {};
      if (splitName.length === currentIndex + 1) {
        r[a] = require(module.path);
      }
      return r[a];
    }, controller);
  });
};

module.exports = {
  loadController(startPath) {
    // 定義要掃描的目錄名稱，依序掃描並載入
    const scanPath = path.join(startPath || this.app.appInfo.root, 'app', 'controller');
    const modules = this.recursiveSearch(scanPath);

    recursiveInject(modules, this.app);
  },
};
