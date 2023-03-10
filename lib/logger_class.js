const jsonStringify = require('fast-safe-stringify');
const { createLogger, format, transports } = require('winston');
const path = require('path');
const extend = require('extend2');
require('winston-daily-rotate-file');

const consoleFormat = (info, type) => {
    const { timestamp, message } = info;
    const label = info.label ? `[${info.label}]` : '';
    const args = info[Symbol.for('splat')] || [];
    const stack = (info.stack) ? `\n${info.stack}` : '';
    const formatRegExp = /%[scdjifoO%]/g;
    let jsonMessage;
    try {
      jsonMessage = JSON.parse(info[Symbol.for('message')]);
    } catch (e) {
      const obj = {};
      obj[info[Symbol.for('message')]] = info[Symbol.for('message')];
      jsonMessage = obj;
    }

    const strArgs = (
      jsonMessage &&
      jsonMessage.message &&
      jsonMessage.message.match(formatRegExp)
    )
      ? ''
      : args.map(jsonStringify).join(' ');
    info.level = (type === 'core') ? `CORE_${info[Symbol.for('level')]}` : info.level;

    // eslint-disable-next-line no-param-reassign
    info[Symbol.for('message')] = `${timestamp} [${info.level.toUpperCase()}]${label} ${message} ${strArgs}${stack}`;

    return info;
  };
class Logger {
  defaultConfig = {
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
  excludeLevels = ['error'];
  constructor(app, type = null) {
    const appConfig = (app.hasOwnProperty('config') && app.config.hasOwnProperty('logger'))
      ? app.config.logger
      : {};
    this.config = extend(true, this.defaultConfig, appConfig);

    return this.createLogger(type);
  }

  createLogger(type) {
    const logger = createLogger({
      silent: (type === 'core' && process.env.APP_ENV.toLowerCase().startsWith('prod')),
      transports: this.getTransports(type),
    });

    return new Proxy(logger, {
      get: function(target, propKey) {
        if(propKey === 'error') {
          const errorMethod = target[propKey];
          return function (...args) {
            if(args.length === 1 && args[0] instanceof Error) {
              const newArgs = [{message: args[0]}];
              return errorMethod.apply(this, newArgs);
            }
            return errorMethod.apply(this, args);
          };
        }

        return target[propKey];
      },
    });
  }

  defaultFormat = (type) => {
    const skipLog = (this.config.consoleLevel === 'NONE');
    return {
      transform(info) {
        if (skipLog) return false;
        return consoleFormat(info, type);
      },
    };
  };

  excludeFormat = () => {
    const skipLog = (this.excludeLevels.includes(Symbol.for('level').toString().toLowerCase()));
    return {
      transform(info) {
        if (skipLog) {
          return false;
        }

        return consoleFormat(info);
      },
    }
  };

  getTransports(type) {
    const _transports = [];
    if(this.config.consoleLevel !== 'NONE') {
      _transports.push(
        new transports.Console({
          level: this.config.consoleLevel.toLowerCase(),
          format: format.combine(
            format.errors({ stack: true }),
            format.align(),
            format.timestamp(),
            format.splat(),
            this.defaultFormat(type),
          ),
        })
      );
    }

    if(this.config.outputLevel !== 'NONE') {

      _transports.push(
        (this.config.enableRotate)
          ? new transports.DailyRotateFile(this.getTransportFileSetting(this.config.outputLevel.toLowerCase()))
          : new transports.File(this.getTransportFileSetting(this.config.outputLevel.toLowerCase()))
      );
      if(this.config.outputLevel !== 'ERROR') {
        _transports.push(
          (this.config.enableRotate)
            ? new transports.DailyRotateFile(this.getTransportFileSetting('error'))
            : new transports.File(this.getTransportFileSetting('error'))
        );
      }
    }

    return _transports;
  }

  getTransportFileSetting(level) {
    const defaultFormat = [
      format.errors({ stack: true }),
      format.timestamp(),
      format.splat(),
    ];

    if(this.config.outputJSON) {
      defaultFormat.push(format.json());
    }

    if(level === 'error') {
      defaultFormat.push(this.defaultFormat());
    }
    else {
      defaultFormat.push(this.excludeFormat());
    }

    const rotateConfig = (this.config.enableRotate) ? this.config.rotate : {};

    return extend(
      true,
      {
        handleExceptions: true,
        filename: this.getFileName(level),
        level,
        format: format.combine(...defaultFormat),
      },
      rotateConfig);
  }

  getFileName(level) {
    const prefix = (this.config.needEnvPrefix) ? `${process.env.APP_ENV}_` : '';
    let filename = (level === 'error') ? this.config.errorLogName : this.config.appLogName;

    if (this.config.enableRotate) {
      if (!filename.match(/%DATE%/)) {
        filename = `${filename}.%DATE%`;
      }
    }
    else {
      if (filename.match(/%DATE%/)) {
        filename = filename.replace(/%DATE%/, '');
      }
    }

    return path.join(app.appInfo.root, this.config.dir, `${prefix}${filename}`);
  }
}

module.exports = {
  Logger,
  Transports: transports,
  format,
};
