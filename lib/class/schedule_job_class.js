/* eslint lines-between-class-members:0 */

const { CronJob } = require('cron');
const ms = require('ms');
const assert = require('assert');

class ScheduleJob {
  started = false; // schedule是否已經啟動
  immediate = false; // schedule是否立即執行
  runningMode; // 'interval' or 'cron'
  taskRunning = false; // 標示task是否正在被執行
  waitForFinish = false; // 是否要判斷上次的tick是否已經被執行完畢

  #task; // 要被執行的code
  /*
  用來儲存 this.run.bind(this)
  主要是在onTick時執行this.run()，避免使用closure function有可能導致GC沒有正常回收的狀況
  但如果直接使用`onTick: this.run`的話，run的this將會被改變
  因此就先bind一個scope為this的function出來
  */
  #scopedRun;
  #intervalTimer; // 用來承接 setInterval 回傳的變數
  #cronJob; // 用來儲存CronJob產生的實體

  constructor({
    interval,
    cron,
    start,
    immediate,
    timeZone = 'Asia/Taipei',
    waitForFinish = false,
  }, task, app) {
    if (!app.utils.is.function(task)) throw new Error('schedule: task必須要是function');
    this.#task = task;
    this.waitForFinish = app.utils.to.boolean(waitForFinish);
    this.ctx = app.newContext();
    this.#scopedRun = this.run.bind(this);

    if (interval) {
      let intervalMs = 0;
      if (typeof interval === 'number') {
        intervalMs = interval;
      } else {
        intervalMs = ms(interval);
      }
      assert(intervalMs, 'schedule: 錯誤的interval設定');
      this.interval = intervalMs;
      this.runningMode = 'interval';
    } else {
      try {
        this.#cronJob = CronJob.from({
          cronTime: cron,
          onTick: this.#scopedRun,
          timeZone,
        });
        this.runningMode = 'cron';
      } catch (e) {
        throw new Error(`schedule: 錯誤的cron設定: ${e.message}`);
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
      this.#intervalTimer = setInterval(this.#scopedRun, this.interval);
    } else {
      this.#cronJob.start();
    }
  }

  stop() {
    if (this.runningMode === 'interval') {
      clearInterval(this.#intervalTimer);
    } else {
      this.#cronJob.stop();
    }
    this.started = false;
  }

  async run() {
    // 如果waitForFinish並且上個任務還沒執行完璧的話，就忽略這次的tick
    if (this.waitForFinish && this.taskRunning) return;

    try {
      this.taskRunning = true;
      await this.#task(this.ctx);
    } catch (err) {
      // 如果發生錯誤，就發送onScheduleError事件
      this.ctx.app.emit('onScheduleError', err, this.ctx);
    } finally {
      // 不管是否有錯誤發生，最後都把taskRunning設定成false
      this.taskRunning = false;
    }
  }
}

module.exports = ScheduleJob;
