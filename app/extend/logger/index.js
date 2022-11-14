const dayjs = require('dayjs');

const toConsole = (...args) => {
  const { log } = console;
  let line = (
    (
      (new Error('log')).stack.split('\n')[2] || '…'
    )
      .match(/\(([^)]+)\)/) || ['', 'not found']
  )[1];
  if (line === 'not found') line = '';
  log.call(console, '\x1B[2m\x1B[3m%s %s\x1B[0m', dayjs().format('YYYY-MM-DD HH:mm:ss'), line);
  log.call(console, ...args);
};

module.exports = {
  console: toConsole,
};
