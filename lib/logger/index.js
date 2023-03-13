const { createLogger, format, transports } = require('winston');
const path = require('path');
const extend = require('extend2');
const formatConcat = require('./format/concat');
require('winston-daily-rotate-file');

const defaultConfig = {
  consoleLevel: 'DEBUG', // NONE, DEBUG, INFO, WARN, ERROR
  dir: 'logs',
  outputLevel: 'NONE', // NONE, DEBUG, INFO, WARN, ERROR
  outputJSON: true,
  needEnvPrefix: true,
  appLogName: 'app-%DATE%.log',
  errorLogName: 'error-%DATE%.log',
  enableRotate: true,
  rotate: {
    datePattern: 'YYYY_MM_DD',
    zippedArchive: true,
    maxSize: '50m',
    maxFiles: '7d',
  },
};

module.exports = (app, type = null) => {
  let finalConfig = {};

  const excludeLevels = ['error'];

  const appConfig = (Object.prototype.hasOwnProperty.call(app, 'config') && Object.prototype.hasOwnProperty.call(app, 'logger'))
    ? app.config.logger
    : {};
  finalConfig = extend(true, defaultConfig, appConfig);

  const consoleFormat = (info) => {
    const i = info;
    const { timestamp, message } = info;
    const label = info.label ? `[${info.label}]` : '';
    const stack = (info.stack) ? `\n${info.stack}` : '';

    i.level = (type === 'core') ? `CORE_${info[Symbol.for('level')]}` : info.level;

    // eslint-disable-next-line no-param-reassign
    i[Symbol.for('message')] = `${timestamp} [${info.level.toUpperCase()}]${label} ${message} ${stack}`;

    return i;
  };

  const defaultFormat = () => {
    const skipLog = (finalConfig.consoleLevel === 'NONE');
    return {
      transform(info) {
        if (skipLog) return false;
        return consoleFormat(info, type);
      },
    };
  };

  const excludeFormat = () => {
    const skipLog = (excludeLevels.includes(Symbol.for('level').toString().toLowerCase()));
    return {
      transform(info) {
        if (skipLog) {
          return false;
        }

        return consoleFormat(info);
      },
    };
  };

  const getFileName = (level) => {
    const prefix = (finalConfig.needEnvPrefix) ? `${process.env.APP_ENV}_` : '';
    let filename = (level === 'error') ? finalConfig.errorLogName : finalConfig.appLogName;

    if (finalConfig.enableRotate) {
      if (!filename.match(/%DATE%/)) {
        filename = `${filename}.%DATE%`;
      }
    } else if (filename.match(/%DATE%/)) {
      filename = filename.replace(/%DATE%/, '');
    }

    return path.normalize(path.join(app.appInfo.root, finalConfig.dir, `${prefix}${filename}`));
  };

  const getTransportFileSetting = (level) => {
    const formats = [
      format.errors({ stack: true }),
      format.timestamp(),
      formatConcat(),
      format.splat(),
    ];

    if (finalConfig.outputJSON) {
      formats.push(format.json());
    }

    if (level === 'error') {
      formats.push(defaultFormat());
    } else {
      formats.push(excludeFormat());
    }

    const rotateConfig = (this.config.enableRotate) ? this.config.rotate : {};

    return extend(
      true,
      {
        handleExceptions: true,
        filename: getFileName(level),
        level,
        format: format.combine(...formats),
      },
      rotateConfig,
    );
  };

  const getTransports = () => {
    const _transports = [];
    if (finalConfig.consoleLevel !== 'NONE') {
      _transports.push(
        new transports.Console({
          level: finalConfig.consoleLevel.toLowerCase(),
          format: format.combine(
            format.errors({ stack: true }),
            format.align(),
            format.timestamp(),
            formatConcat(),
            format.splat(),
            defaultFormat(),
          ),
        }),
      );
    }

    if (finalConfig.outputLevel !== 'NONE') {
      _transports.push(
        (finalConfig.enableRotate)
          ? new transports.DailyRotateFile(getTransportFileSetting(finalConfig.outputLevel.toLowerCase()))
          : new transports.File(getTransportFileSetting(finalConfig.outputLevel.toLowerCase())),
      );
      if (finalConfig.outputLevel !== 'ERROR') {
        _transports.push(
          (finalConfig.enableRotate)
            ? new transports.DailyRotateFile(getTransportFileSetting('error'))
            : new transports.File(getTransportFileSetting('error')),
        );
      }
    }

    return _transports;
  };

  const Logger = () => {
    const logger = createLogger({
      silent: (type === 'core' && process.env.APP_ENV.toLowerCase().startsWith('prod')),
      transports: getTransports(),
    });

    return new Proxy(logger, {
      get(target, propKey) {
        if (propKey === 'error') {
          const errorMethod = target[propKey];
          return function (...args) {
            if (args.length === 1 && args[0] instanceof Error) {
              const newArgs = [{ message: args[0] }];
              return errorMethod.apply(this, newArgs);
            }
            return errorMethod.apply(this, args);
          };
        }

        return target[propKey];
      },
    });
  };

  return {
    Logger: Logger(),
    Transports: transports,
    Format: format,
  };
};
