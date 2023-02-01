/* eslint global-require:0, import/no-dynamic-require:0 */

const path = require('path');
const fs = require('fs');

const extendLoader = (loader, extendPath) => {
  let loadedExtend;
  if (fs.existsSync(extendPath)) loadedExtend = require(extendPath);
  if (loadedExtend) {
    // 如果extend是一個function，就帶入app為參數，取得執行後的extend物件
    if (typeof loadedExtend === 'function') loadedExtend = loadedExtend(loader.app);

    const properties = Object.getOwnPropertyNames(loadedExtend);
    properties.forEach((v1) => {
      const descriptor = Object.getOwnPropertyDescriptor(loadedExtend, v1);
      if (loader.getFileName(extendPath) === 'application') {
        Object.defineProperty(loader.app, v1, descriptor);
      } else {
        Object.defineProperty(loader.app[loader.getFileName(extendPath)], v1, descriptor);
      }
    });
  }
};

module.exports = {
  loadExtend(startPath) {
    const rootPath = startPath || this.app.appInfo.root;

    extendLoader(this, path.join(rootPath, 'app/extend/application.js'));
    extendLoader(this, path.join(rootPath, 'app/extend/context.js'));
  },
};
