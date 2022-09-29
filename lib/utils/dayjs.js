const dayjs = require('dayjs');

module.exports = dayjs;
module.exports.isValid = (date, strict = false, format = 'YYYY-MM-DD') => {
  if (strict) {
    const _dayjs = module.exports.loadPlugin('customParseFormat');
    return _dayjs(date, format, true).isValid();
  }

  return module.exports(date).isValid();
};
module.exports.loadPlugin = (pluginName) => {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const plugin = require(`dayjs/plugin/${pluginName}`);
  module.exports.extend(plugin);

  return module.exports;
};
module.exports.loadLocale = (localeName) => {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  require(`dayjs/locale/${localeName}`);

  module.exports.locale(localeName);

  return module.exports;
};
