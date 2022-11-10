/* eslint global-require:0, import/no-dynamic-require:0, no-param-reassign:0 */

const path = require('path');
const ScheduleJob = require('../../class/schedule_job_class');

const loadToApp = (modules, app) => {
  const { is, to } = app.utils;
  app.schedule = {};
  modules.forEach((module) => {
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

    if (!enable) return;

    app.schedule[module.nameSpace] = new ScheduleJob(required.schedule, required.task, app);
  });
};

module.exports = {
  loadSchedule(startPath) {
    const scanPath = path.join(startPath || this.app.appInfo.root, 'app', 'schedule');
    const modules = this.recursiveSearch(scanPath);

    loadToApp(modules, this.app);
  },
};
