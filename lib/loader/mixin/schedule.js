/* eslint global-require:0, import/no-dynamic-require:0, no-param-reassign:0 */

const path = require('path');
const ScheduleJob = require('../../class/schedule_job_class');

/**
 * 利用recursiveSearch得到的物件
 * 載入模組並注入到app相對應的變數中
 */
const recursiveInject = (modules, app) => {
  if (modules.length === 0) return;
  const { schedule } = app;
  const { is, to } = app.utils;

  modules.forEach((module) => {
    const splitName = module.nameSpace.split('.');
    splitName.reduce((r, a, currentIndex) => {
      r[a] = r[a] || {};
      if (splitName.length === currentIndex + 1) {
        const required = require(module.path);
        let enable = true;
        if (required.schedule.enable !== undefined) {
          enable = to.boolean(required.schedule.enable);
        }

        if (enable && required.schedule.env) {
          if (is.string(required.schedule.env)) {
            enable = required.schedule.env === process.env.APP_ENV;
          } else if (is.array(required.schedule.env)) {
            enable = required.schedule.env.includes(process.env.APP_ENV);
          }
        }

        if (enable) {
          r[a] = new ScheduleJob(required.schedule, required.task, app);
        }
      }
      return r[a];
    }, schedule);
  });
};

module.exports = {
  loadSchedule(startPath) {
    const scanPath = path.join(startPath || this.app.appInfo.root, 'app', 'schedule');
    const modules = this.recursiveSearch(scanPath);

    recursiveInject(modules, this.app);
  },
};
