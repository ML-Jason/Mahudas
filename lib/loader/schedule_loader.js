/* eslint global-require:0, import/no-dynamic-require:0, no-param-reassign:0 */

const fs = require('fs');
const path = require('path');
const ScheduleJob = require('../class/schedule_job_class');
const toCamelCase = require('../to_camel_case');

const recursiveSearch = (dirPath) => {
  const modules = {};
  try {
    const directX = fs.readdirSync(dirPath);
    directX.forEach((pName) => {
      const currentPath = path.join(dirPath, pName);
      const targetFS = fs.statSync(currentPath);
      const mName = toCamelCase(pName.replace(/\.js$/, ''));

      // 如果命名是"-"開頭，就忽略
      if (mName.indexOf('-') === 0) return;

      if (targetFS.isDirectory()) {
        modules[mName] = recursiveSearch(currentPath);
      } else {
        modules[mName] = currentPath;
      }
    });
  } catch (e) { /** */ }
  return modules;
};

const loadToApp = (moduleMap, app) => {
  app.schedule = {};
  Object.entries(moduleMap).forEach(([key, filePath]) => {
    const required = require(filePath);
    let enable = true;
    if (required.schedule.enable !== undefined) {
      enable = app.utils.to.boolean(required.schedule.enable);
    }
    if (enable && required.schedule.env) {
      enable = required.schedule.env === process.env.APP_ENV;
    }
    if (!enable) return;
    const job = new ScheduleJob(required.schedule, required.task, app);
    app.schedule[key] = job;
  });
};

const run = (app, rootPath) => {
  const scanPath = path.join(rootPath, 'app', 'schedule');
  const modules = recursiveSearch(scanPath);
  loadToApp(modules, app);
};

module.exports = run;
