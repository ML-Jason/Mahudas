const { format, transports } = require('winston');
const extend = require('extend2');
const path = require('path');
const transLevel = require('../format/transLevel');
const splat = require('../format/splat');
const defaultConsole = require('../format/defaultConsole');
const excludeLevel = require('../format/excludeLevel');
require('winston-daily-rotate-file');

const getFileName = (config, level) => {
  const prefix = (config.needEnvPrefix) ? `${process.env.APP_ENV}_` : '';
  let filename = (level === 'error') ? config.errorLogName : config.appLogName;

  if (config.enableRotate) {
    if (!filename.match(/%DATE%/)) {
      filename = `${filename}.%DATE%`;
    }
  } else if (filename.match(/%DATE%/)) {
    filename = filename.replace(/%DATE%/, '');
  }

  return path.normalize(path.join(config.dir, `${prefix}${filename}`));
};

const getTransportFileSetting = (config, level) => {
  const formats = [
    transLevel(),
    format.timestamp(),
    splat(),
    defaultConsole(),
  ];

  if (config.outputJSON) {
    formats.push(format.json());
  }

  // 如果level不是error，在第一個format就把error訊息直接忽略
  if (level !== 'error') {
    formats.unshift(excludeLevel(['error']));
  }

  const rotateConfig = (config.enableRotate) ? config.rotate : {};

  return extend(
    true,
    {
      handleExceptions: true,
      filename: getFileName(config, level),
      level,
      format: format.combine(...formats),
    },
    rotateConfig,
  );
};

const get = (config, level) => {
  const setting = getTransportFileSetting(config, level);
  if (config.enableRotate) {
    return new transports.DailyRotateFile(setting);
  }
  return new transports.File(setting);
};

module.exports = get;
