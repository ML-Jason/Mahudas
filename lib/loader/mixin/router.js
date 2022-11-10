/* eslint global-require:0, import/no-dynamic-require:0 */
const path = require('path');

/**
 * 利用recursiveSearch得到的物件
 * 載入模組並注入到app相對應的變數中
 */
const recursiveInject = (modules, app) => {
  if (modules.length === 0) return;

  modules.forEach((module) => {
    require(module.path)(app);
  });
};

module.exports = {
  loadRouter(startPath) {
    const scanPath = path.join(startPath || this.app.appInfo.root, 'app', 'router');
    const modules = this.recursiveSearch(scanPath);
    recursiveInject(modules, this.app);
  },
};
