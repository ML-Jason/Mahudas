const jsonStringify = require('fast-safe-stringify');

/**
 * Captures the number of format (i.e. %s strings) in a given string.
 * Based on `util.format`, see Node.js source:
 * https://github.com/nodejs/node/blob/b1c8f15c5f169e021f7c46eb7b219de95fe97603/lib/util.js#L201-L230
 * @type {RegExp}
 */
const formatRegExp = /%[scdjifoO%]/g;

class Concat {
  constructor(opts) {
    this.options = {
      sep: ' ',
    };
    this.options = Object.assign(this.options, opts);
  }

  // eslint-disable-next-line class-methods-use-this
  isPrimitive(target) {
    return target === null
      || typeof target === 'boolean'
      || typeof target === 'number'
      || typeof target === 'string'
      || typeof target === 'symbol' // ES6 symbol
      || typeof target === 'undefined';
  }

  splatsToString(splats) {
    return splats.map((splat) => {
      if (this.isPrimitive(splat)) {
        return splat.toString();
      }
      return jsonStringify(splat);
    }).join(this.options.sep);
  }

  transform(info) {
    const _info = info;
    const splat = _info[Symbol.for('splat')] || _info.splat;

    if (!splat || !splat.length) {
      return _info;
    }

    const strArgs = (_info.message.match(formatRegExp)) ? '' : this.splatsToString(splat);
    _info.message = `${_info.message}${this.options.sep}${strArgs}`;

    return _info;
  }
}

module.exports = (opts) => new Concat(opts);
