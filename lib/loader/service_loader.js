const fs = require('fs');
const path = require('path');
const toCamelCase = require('../to_camel_case');

/**
 * 遍尋目錄下的所有檔案
 * 將名稱與路徑儲存在一個物件中，用來提供給loadApp後續使用
 */
const recursiveSearch = (startPath, subPath = '') => {
  let modules = [];
  try {
    const scanPath = path.join(startPath, subPath);
    const directX = fs.readdirSync(scanPath, { withFileTypes: true });
    directX.forEach((dirent) => {
      // 如果命名是"-"開頭，就忽略
      if (dirent.name.indexOf('-') === 0) return;

      const currentPath = path.join(scanPath, dirent.name);
      if (dirent.isDirectory()) {
        const subModules = recursiveSearch(startPath, path.join(subPath, dirent.name));
        modules = [...modules, ...subModules];
      } else {
        const nameSpace = currentPath
          .replace(/\.js$/, '')
          .replace(`${startPath}/`, '')
          .split('/')
          .map((v) => toCamelCase(v))
          .join('.');
        modules.push({
          nameSpace,
          path: currentPath,
        });
      }
    });
  } catch (e) { /** */ }
  return modules;
};

const run = (app, rootPath) => {
  // 掃描service目錄
  const scanPath = path.join(rootPath, 'app', 'service');
  const modules = recursiveSearch(scanPath);

  return modules;
};

module.exports = run;
