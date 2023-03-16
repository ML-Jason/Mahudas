const { format, transports } = require('winston');
const transLevel = require('../format/transLevel');
const splat = require('../format/splat');
const defaultConsole = require('../format/defaultConsole');

const get = (config) => {
  const transport = new transports.Console({
    level: config.consoleLevel,
    format: format.combine(
      transLevel(),
      format.align(),
      format.timestamp(),
      splat(),
      defaultConsole(config),
    ),
  });
  return transport;
};

module.exports = get;
