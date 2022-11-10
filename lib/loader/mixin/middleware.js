/* eslint global-require:0, import/no-dynamic-require:0, no-param-reassign:0 */
const path = require('path');

/**
 * 利用recursiveSearch得到的物件
 * 載入模組並注入到app相對應的變數中
 */
const recursiveInject = (modules, app) => {
  const { middleware } = app;
  if (modules.length === 0) {
    return;
  }

  modules.forEach((module) => {
    const splitName = module.nameSpace.split('.');
    const loadedModule = require(module.path);

    if (splitName.length) {
      splitName.reduce((r, a, currentIndex) => {
        r[a] = r[a] || {};
        if (splitName.length === currentIndex + 1) {
          r[a] = loadedModule(app);
        }
        return r[a];
      }, middleware);
    } else {
      middleware[module.nameSpace] = loadedModule(app);
    }
  });
};

module.exports = {
  loadMiddleware(startPath) {
    const scanPath = path.join(startPath || this.app.appInfo.root, 'app', 'middleware');
    const modules = this.recursiveSearch(scanPath);
    recursiveInject(modules, this.app);
  },
};
