const { CronJob } = require('cron');
const ms = require('ms');
const assert = require('assert');

class ScheduleJob {
  constructor({
    interval,
    cron,
    start,
    immediate,
    timeZone = 'Asia/Taipei',
  }, task, app) {
    this.task = task;
    this.ctx = app.newContext();

    if (interval) {
      let intervalMs = 0;
      if (typeof interval === 'number') {
        intervalMs = interval;
      } else {
        intervalMs = ms(interval);
      }
      assert(intervalMs, '錯誤的interval設定');
      this.interval = intervalMs;
      this.runningMode = 'interval';
    } else {
      try {
        const job = new CronJob({
          cronTime: cron,
          onTick: () => {
            this.task(this.ctx);
          },
          timeZone,
        });
        this.cronJob = job;
        this.runningMode = 'cron';
      } catch (e) {
        throw new Error(`錯誤的cron設定: ${e.message}`);
      }
    }

    this.started = false;
    this.immediate = app.utils.to.boolean(immediate);
    if (app.utils.to.boolean(start)) this.start();
  }

  start() {
    if (this.started) return;
    this.started = true;
    if (this.runningMode === 'interval') {
      this.intervalTimer = setInterval(() => {
        this.task(this.ctx);
      }, this.interval);
    } else {
      this.cronJob.start();
    }
  }

  stop() {
    if (this.runningMode === 'interval') {
      clearInterval(this.intervalTimer);
    } else {
      this.cronJob.stop();
    }
    this.started = false;
  }

  async run() {
    await this.task(this.ctx);
  }
}

module.exports = ScheduleJob;
