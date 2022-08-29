/* eslint global-require:0, import/no-dynamic-require:0 */

/**
 * 用來載入config的Loader
 */

const fs = require('fs-extra');
const path = require('path');

const run = (appInfo) => {
  const appRoot = appInfo.root;
  // 載入config.default
  let configFilePath = path.join(appRoot, './config/config.default.js');
  let defaultConfig = {};
  if (fs.existsSync(configFilePath)) defaultConfig = require(configFilePath);

  /**
   * 從APP_ENV判斷要載入的config。
   * 先判斷該檔案是否存在，是的話就載入。
   */
  const appEnv = process.env.APP_ENV || 'dev';
  configFilePath = path.join(appRoot, 'config', `config.${appEnv}.js`);
  let envConfig = {};
  if (fs.existsSync(configFilePath)) envConfig = require(configFilePath);

  const config = {
    ...defaultConfig, ...envConfig,
  };

  return config;
};

module.exports = run;
