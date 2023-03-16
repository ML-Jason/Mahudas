/* eslint no-unused-vars:0 */

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';
process.env.APP_ENV = process.env.APP_ENV || 'local';

/**
 * 程式進入點
 */
const Mahudas = require('./lib/class/mahudas_class');

// 如果Mahudas是被直接啟動的，則直接初始化Mahudas instance
// 如果是透過npm run mahudas啟動的，會由/bin/launcher.js初始化instance
if (require.main === module) {
  const app = new Mahudas();
}

module.exports = Mahudas;
