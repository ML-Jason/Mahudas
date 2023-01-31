/* eslint no-console:0 */
const typeCodes = {};

const exitHandler = async (type, err, app) => {
  // SIGINT有時會重複觸發，由這邊過濾
  if (typeCodes[type]) return;
  typeCodes[type] = true;

  if (type !== 'exit') {
    /**
     * 關閉服務前的動作
     *
     * 1. 檢查是否為非預期錯誤發生，
     * 如果是的話就發出uncaughtException事件，並等待監聽者處理完畢
     *
     * 2. 呼叫app.close()
     * 讓有監聽beforeClose事件的程式執行完畢(例如:切斷資料庫)
     *
     *
     * 不論1或2是否已經執行完成，如果等待太久，3秒後強制關閉服務
     */
    setTimeout(() => { process.exit(1); }, 3000);

    if (type === 'uncaughtException' || type === 'unhandledRejection') {
      console.log('\x1b[31m%s\x1b[0m', `▉ ${type}`);
      console.log(err);

      await app.onUncaughtException(err);
    }

    await app.close();
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
