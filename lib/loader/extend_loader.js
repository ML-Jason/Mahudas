/* eslint global-require:0, import/no-dynamic-require:0 */
const path = require('path');

const loadContextExt = async (app) => {
  const appRoot = app.appInfo.root;

  let loadedExtend;
  try {
    loadedExtend = require(path.join(appRoot, 'app/extend/context.js'));
  } catch (e) { /** */ }
  if (loadedExtend) {
    // 將所載入的function/properties擴充到app.context
    const properties = Object.getOwnPropertyNames(loadedExtend);
    properties.forEach((v1) => {
      const descriptor = Object.getOwnPropertyDescriptor(loadedExtend, v1);
      Object.defineProperty(app.context, v1, descriptor);
    });
  }
};

const loadApplicationExt = async (app, extPath) => {
  let loadedExtend;
  try {
    loadedExtend = require(extPath);
  } catch (e) { /** */ }
  if (loadedExtend) {
    // 將所載入的function/properties擴充到app
    const properties = Object.getOwnPropertyNames(loadedExtend);
    properties.forEach((v1) => {
      const descriptor = Object.getOwnPropertyDescriptor(loadedExtend, v1);
      Object.defineProperty(app, v1, descriptor);
    });
  }
};

const loadExt = async (app) => {
  const appRoot = app.appInfo.root;

  // 如果Mahudas是被用package的方式執行
  // 先去掛載Mahudas內建的extend
  if (app.appInfo.startMode === 'framework') {
    await loadApplicationExt(app, path.join(__dirname, '../..', 'app/extend/application.js'));
    await loadContextExt(app, path.join(__dirname, '../..', 'app/extend/context.js'));
  }
  await loadApplicationExt(app, path.join(appRoot, 'app/extend/application.js'));
  await loadContextExt(app, path.join(appRoot, 'app/extend/context.js'));
};

module.exports = loadExt;
