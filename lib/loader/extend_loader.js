/* eslint global-require:0, import/no-dynamic-require:0 */
const path = require('path');
const fs = require('fs');

const loadContextExt = (app, extPath) => {
  let loadedExtend;
  if (fs.existsSync(extPath)) loadedExtend = require(extPath);
  if (loadedExtend) {
    // 將所載入的function/properties擴充到app.context
    const properties = Object.getOwnPropertyNames(loadedExtend);
    properties.forEach((v1) => {
      const descriptor = Object.getOwnPropertyDescriptor(loadedExtend, v1);
      Object.defineProperty(app.context, v1, descriptor);
    });
  }
};

const loadApplicationExt = (app, extPath) => {
  let loadedExtend;
  if (fs.existsSync(extPath)) loadedExtend = require(extPath);
  if (loadedExtend) {
    // 將所載入的function/properties擴充到app
    const properties = Object.getOwnPropertyNames(loadedExtend);
    properties.forEach((v1) => {
      const descriptor = Object.getOwnPropertyDescriptor(loadedExtend, v1);
      Object.defineProperty(app, v1, descriptor);
    });
  }
};

const loadExt = (app, rootPath) => {
  loadApplicationExt(app, path.join(rootPath, 'app/extend/application.js'));
  loadContextExt(app, path.join(rootPath, 'app/extend/context.js'));
};

module.exports = loadExt;
