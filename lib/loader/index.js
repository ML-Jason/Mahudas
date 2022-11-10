/* eslint global-require:0, import/no-dynamic-require:0 */

const fs = require('fs');
const path = require('path');

const getFileName = (filePath) => {
  const fileName = path.basename(filePath);
  return fileName.substring(0, fileName.lastIndexOf('.'));
};

const stringToCamelCase = (str) => {
  const splitStrings = str.split('_');
  let newString = '';
  splitStrings.forEach((v) => {
    if (newString === '') {
      newString = v.toLowerCase();
    } else {
      newString += v[0].toUpperCase() + v.slice(1);
    }
  });
  return newString;
};

class Loader {
  constructor(app) {
    this.app = app;
    this.getFileName = getFileName.bind(this);
    this.stringToCamelCase = stringToCamelCase.bind(this);
  }

  pathToCamelCase(filePath, replacePath) {
    let returnPath = filePath.replace(/\.js$/, '');
    if (replacePath !== undefined) {
      returnPath = returnPath.replace(`${replacePath}/`, '');
    }

    return returnPath
      .split('/')
      .map((v) => this.stringToCamelCase(v))
      .join('.');
  }

  /**
   * 遍尋目錄下的所有檔案
   * 將名稱與路徑儲存在一個物件中
   */
  recursiveSearch(startPath, subPath = '') {
    let modules = [];
    try {
      const scanPath = path.join(startPath, subPath);
      const directX = fs.readdirSync(scanPath, { withFileTypes: true });
      directX.forEach((dirent) => {
        // 如果命名是"-"開頭，就忽略載入
        if (dirent.name.indexOf('-') === 0) return;

        const currentPath = path.join(scanPath, dirent.name);
        if (dirent.isDirectory()) {
          const subModules = this.recursiveSearch(startPath, path.join(subPath, dirent.name));
          modules = [...modules, ...subModules];
        } else {
          modules.push({
            nameSpace: this.pathToCamelCase(currentPath, startPath),
            path: currentPath,
          });
        }
      });
    } catch (e) { /** */ }
    return modules;
  }
}

/**
 * Mixin methods to Loader
 * // ES6 Multiple Inheritance
 * https://medium.com/@leocavalcante/es6-multiple-inheritance-73a3c66d2b6b
 */
const loaders = [
  require('./mixin/config'),
  require('./mixin/core_middleware'),
  require('./mixin/extend'),
  require('./mixin/service'),
  require('./mixin/middleware'),
  require('./mixin/controller'),
  require('./mixin/schedule'),
  require('./mixin/router'),
];

// eslint-disable-next-line no-restricted-syntax
for (const loader of loaders) {
  Object.assign(Loader.prototype, loader);
}

module.exports = Loader;
