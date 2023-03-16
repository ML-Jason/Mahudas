const { createLogger, format, transports } = require('winston');
const winstonProxy = require('./winstonProxy');
const transLevel = require('./format/transLevel');
const splat = require('./format/splat');
const defaultConsole = require('./format/defaultConsole');

const getCoreLogger = () => {
  const logger = createLogger({
    silent: process.env.APP_ENV.toLowerCase().startsWith('prod'),
    level: 'debug',
    format: format.errors({ stack: true }),
    transports: [
      new transports.Console({
        format: format.combine(
          transLevel('core'),
          format.align(),
          format.timestamp(),
          splat(),
          defaultConsole(),
        ),
      }),
    ],
  });

  return new Proxy(logger, winstonProxy);
};

module.exports = getCoreLogger;
