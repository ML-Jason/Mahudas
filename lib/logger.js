const jsonStringify = require('fast-safe-stringify');
const { createLogger, format, transports } = require('winston');
const path = require('path');
const extend = require('extend2');
require('winston-daily-rotate-file');

const defaultConfig = {
  logDir: 'logs',
  outputFile: true,
  rotate: {
    datePattern: 'YYYY_MM_DD',
    zippedArchive: true,
    maxSize: '50m',
    maxFiles: '7d',
  },
};

const consoleFormat = (info) => {
  const { timestamp, message } = info;
  const label = info.label ? `[${info.label}]` : '';
  const args = info[Symbol.for('splat')] || [];
  const formatRegExp = /%[scdjifoO%]/g;
  const strArgs = (JSON.parse(info[Symbol.for('message')]).message.match(formatRegExp))
    ? ''
    : args.map(jsonStringify).join(' ');

  // eslint-disable-next-line no-param-reassign
  info[Symbol.for('message')] = `${timestamp} [${info.level}]${label} ${message} ${strArgs}`;

  return info;
};

const defaultFormat = {
  transform(info) {
    return consoleFormat(info);
  },
};

const excludeFormat = {
  transform(info) {
    const excludeLevels = ['error'];
    const _info = consoleFormat(info);
    if (excludeLevels.includes(_info.level)) {
      return false;
    }

    return _info;
  },
};

const logger = () => {
  const _logger = createLogger({
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.align(),
          format.timestamp(),
          format.splat(),
          defaultFormat,
        ),
      }),
    ],
  });

  return {
    mountConsoleLogger: _logger,
    getFileTransports: (app) => {
      const config = extend(true, defaultConfig, app.config.logger);
      const transport = [];

      if (config.outputFile) {
        transport.push(
          new transports.DailyRotateFile({
            filename: path.join(app.appInfo.root, 'logs', `${process.env.APP_ENV}_combined-%DATE%.log`),
            format: format.combine(
              format.timestamp(),
              format.splat(),
              excludeFormat,
            ),
            ...config.rotate,
          }),
        );

        transport.push(
          new transports.DailyRotateFile({
            filename: path.join(app.appInfo.root, 'logs', `${process.env.APP_ENV}_error-%DATE%.log`),
            level: 'error',
            format: format.combine(
              format.timestamp(),
              format.splat(),
              defaultFormat,
            ),
            ...config.rotate,
          }),
        );
      }

      return transport;
    },
  };
};

module.exports = logger();
