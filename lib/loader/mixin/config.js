/* eslint global-require:0, import/no-dynamic-require:0 */

const fs = require('fs');
const path = require('path');
const extend = require('extend2');

module.exports = {
  loadConfig(startPath, isPlugin = false) {
    const rootPath = startPath || this.app.appInfo.root;
    const configNamePrefix = (isPlugin) ? 'plugin' : 'config';

    // 載入config.default
    let configFilePath = path.join(rootPath, `config/${configNamePrefix}.default.js`);
    let defaultConfig = {};
    if (fs.existsSync(configFilePath)) defaultConfig = require(configFilePath);

    /**
     * 從APP_ENV判斷要載入的config。
     * 先判斷該檔案是否存在，是的話就載入。
     */
    const appEnv = process.env.APP_ENV || 'dev';
    configFilePath = path.join(rootPath, 'config', `${configNamePrefix}.${appEnv}.js`);
    let envConfig = {};
    if (fs.existsSync(configFilePath)) envConfig = require(configFilePath);

    return extend(true, defaultConfig, envConfig);
  },
};
