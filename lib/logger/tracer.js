const proxiedLog = (logger) => {
  const { debug } = logger;

  const newDebug = (...args) => {
    const line = ((new Error('trace').stack.split('\n')[2] || '…').match(
      /\(([^)]+)\)/,
    ) || ['', 'not found'])[1];

    if (line !== 'not found') {
      // eslint-disable-next-line
      console.log('\x1B[2m\x1B[3m%s\x1B[0m', line);
    }

    debug.call(logger, ...args);
  };
  return newDebug;
};

module.exports = proxiedLog;
