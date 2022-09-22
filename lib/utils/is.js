/**
 * 參考 is-type-of
 * https://www.npmjs.com/package/is-type-of
 * 整合
 */
const stream = require('stream');
const buffer = require('buffer');

const { toString: functionToString } = Function.prototype;
const fnBody = (functionString) => functionToString.call(functionString).replace(/^[^{]*{\s*/, '').replace(/\s*}[^}]*$/, '');
const MAX_INT_31 = 2 ** 31;

module.exports = {
  class(target) {
    return (typeof target === 'function'
      && (/^class(?:\s|{)/.test(functionToString.call(target))
        || (/^.*classCallCheck\(/.test(fnBody(target)))) // babel.js
    );
  },

  stream(target) {
    return target instanceof stream.Stream;
  },

  readableStream(target) {
    return this.stream(target) && typeof target._read === 'function' && typeof target._readableState === 'object';
  },

  writableStream(target) {
    return this.stream(target) && typeof target._write === 'function' && typeof target._writableState === 'object';
  },

  duplexStream(target) {
    return this.readableStream(target) && this.writableStream(target);
  },

  finite(target) {
    return Number.isFinite(target);
  },

  NaN(target) {
    return Number.isNaN(target);
  },

  boolean(target) {
    return typeof target === 'boolean';
  },

  null(target) {
    return target === null;
  },

  nullOrUndefined(target) {
    return target == null;
  },

  number(target) {
    return typeof target === 'number';
  },

  string(target) {
    return typeof target === 'string';
  },

  symbol(target) {
    return typeof target === 'symbol';
  },

  undefined(target) {
    // eslint-disable-next-line no-void,valid-typeof
    return typeof target === void 0;
  },

  object(target) {
    return typeof target === 'object' && target !== null;
  },

  function(target) {
    return typeof target === 'function';
  },

  buffer(target) {
    return buffer.Buffer.isBuffer(target);
  },

  generator(target) {
    return target
      && typeof target.next === 'function'
      && typeof target.throw === 'function';
  },

  generatorFunction(target) {
    return target
      && target.constructor
      && target.constructor.name === 'GeneratorFunction';
  },

  asyncFunction(target) {
    return target
      && target.constructor
      && target.constructor.name === 'AsyncFunction';
  },

  promise(target) {
    return target
      && typeof target.then === 'function';
  },

  int(target) {
    return this.number(target)
      && target % 1 === 0;
  },

  int32(target) {
    return this.int(target)
      && target < MAX_INT_31
      && target >= -MAX_INT_31;
  },

  long(target) {
    return this.int(target)
      && (target >= MAX_INT_31 || target < -MAX_INT_31);
  },

  Long(target) {
    return this.object(target)
      && this.number(target.high)
      && this.number(target.low);
  },

  double(target) {
    return this.number(target)
      && !this.NaN(target)
      && target % 1 !== 0;
  },

  date(target) {
    return target instanceof Date;
  },

  regExp(target) {
    return target instanceof RegExp;
  },

  error(target) {
    return target instanceof Error;
  },

  array(target) {
    return Array.isArray(target);
  },

  primitive(target) {
    return target === null
    || typeof target === 'boolean'
    || typeof target === 'number'
    || typeof target === 'string'
    || typeof target === 'symbol' // ES6 symbol
    || typeof target === 'undefined';
  },
};
