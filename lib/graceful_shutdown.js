const typeCodes = {};

const exitHandler = async (type, err, app) => {
  // SIGINT有時會重複觸發，由這邊過濾
  if (typeCodes[type]) return;
  typeCodes[type] = true;

  if (type !== 'exit') {
    if (type === 'uncaughtException' || type === 'unhandledRejection') {
      console.log('\x1b[1m\x1b[41m\x1b[37m%s\x1b[0m', `===== ${type} =====`);
      console.log('\x1b[1m\x1b[31m');
      console.log(err);
      console.log('\x1b[1m\x1b[41m\x1b[37m%s\x1b[0m', '=======================================');
    }

    /**
     * 讓有監聽beforeClose事件的程式執行完畢(例如:切斷資料庫)後關閉系統
     * 如果等待太久，就3秒後強制關閉
     */
    setTimeout(() => { process.exit(1); }, 3000);
    await Promise.all(app.listeners('beforeClose').map((v) => v()));
    process.exit(1);
  }
};

module.exports = (app) => {
  process.on('SIGINT', (e) => { exitHandler('SIGINT', e, app); });
  process.on('SIGTERM', (e) => { exitHandler('SIGTERM', e, app); });
  process.on('exit', (e) => { exitHandler('exit', e, app); });
  process.on('uncaughtException', (e) => { exitHandler('uncaughtException', e, app); });
  // 針對promise裡的uncaughtException
  process.on('unhandledRejection', (e) => { exitHandler('unhandledRejection', e, app); });
};
