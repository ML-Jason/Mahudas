/**
 * 改寫console
 * 讓console.log出來的資訊，加上程式碼位置與時間
 * (部分在背景執行的程式會沒辦法列出程式碼)
 */

const { log } = console;
function proxiedLog(...args) {
  let line = (
    (
      (new Error('log')).stack.split('\n')[2] || '…'
    )
      .match(/\(([^)]+)\)/) || ['', 'not found']
  )[1];
  if (line === 'not found') line = '';
  log.call(console, line, (new Date()).toString());
  log.call(console, ...args);
}
console.info = proxiedLog;
console.log = proxiedLog;
