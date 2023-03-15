const { createLogger, format, transports } = require('winston');
const extend = require('extend2');
const tracer = require('./tracer');
const consoleTransport = require('./transport/console');
const fileTransport = require('./transport/file');
const silentTransport = require('./transport/silent');

const defaultConfig = {
  consoleLevel: process.env.APP_ENV.toLowerCase().startsWith('prod') ? 'info' : 'debug',
  dir: 'logs',
  outputLevel: 'none',
  outputJSON: true,
  needEnvPrefix: true,
  appLogName: 'app-%DATE%.log',
  errorLogName: 'error-%DATE%.log',
  enableRotate: true,
  rotate: {
    datePattern: 'YYYY_MM_DD',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '7d',
  },

  // 是否允許trace，允許的話，logger.debug會額外印出程式發生的檔案與行號
  // trace的額外資訊不會寫入file裡
  trace: false,
};

module.exports = (app) => {
  const appConfig = app.config.logger || {};
  const finalConfig = extend(true, defaultConfig, appConfig);

  const loggerTransports = [];
  if (finalConfig.consoleLevel === 'none' && finalConfig.outputLevel === 'none') {
    // 如果console跟output都是none的話，還是要提供一個空個transport，否則winston會跳alert
    loggerTransports.push(silentTransport());
  } else {
    if (finalConfig.consoleLevel !== 'none') loggerTransports.push(consoleTransport(finalConfig));
    if (finalConfig.outputLevel !== 'none') {
      loggerTransports.push(fileTransport(finalConfig, finalConfig.outputLevel));
      loggerTransports.push(fileTransport(finalConfig, 'error'));
    }
  }
  const logger = createLogger({
    format: format.errors({ stack: true }),
    transports: loggerTransports,
  });
  if (finalConfig.trace) logger.debug = tracer(logger);

  return {
    Logger: logger,
    Transports: transports,
    Format: format,
  };
};
