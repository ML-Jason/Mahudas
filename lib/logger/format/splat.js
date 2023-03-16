const util = require('util');

const formatSplat = () => ({
  transform(info) {
    const splat = info[Symbol.for('splat')] || info.splat || [];

    return { ...info, message: util.format(info.message, ...splat) };
  },
});

module.exports = formatSplat;
