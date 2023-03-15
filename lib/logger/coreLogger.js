const { createLogger, format, transports } = require('winston');
const transLevel = require('./format/transLevel');
const beforeSplat = require('./format/beforeSplat');
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
          beforeSplat(),
          format.splat(),
          defaultConsole(),
        ),
      }),
    ],
  });

  return logger;
};

module.exports = getCoreLogger;
