/* eslint no-console:0 */

/**
 * 改寫console
 * 讓console.log出來的資訊，加上程式碼位置與時間
 * (部分在背景執行的程式會沒辦法列出程式碼)
 */

function proxiedLog(type) {
  const log = console[type];
  const dealmessage = (...args) => {
    let line = (
      (
        (new Error('log')).stack.split('\n')[2] || '…'
      )
        .match(/\(([^)]+)\)/) || ['', 'not found']
    )[1];
    if (line === 'not found') line = '';
    log.call(console, '\x1B[2m\x1B[3m%s %s\x1B[0m', (new Date()).toString(), line);
    log.call(console, ...args);
  };
  return dealmessage;
}
console.info = proxiedLog('info');
console.log = proxiedLog('log');
