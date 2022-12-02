/**
 * 參考 is-type-of
 * https://www.npmjs.com/package/is-type-of
 * 整合
 */
const stream = require('stream');
const { Buffer } = require('node:buffer');
const extend = require('extend2');

const { toString: functionToString } = Function.prototype;
const fnBody = (functionString) => functionToString.call(functionString).replace(/^[^{]*{\s*/, '').replace(/\s*}[^}]*$/, '');
const MAX_INT_31 = 2 ** 31;

const IPv4SegmentFormat = '(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])';
const IPv4AddressFormat = `(${IPv4SegmentFormat}[.]){3}${IPv4SegmentFormat}`;
const IPv4AddressRegExp = new RegExp(`^${IPv4AddressFormat}$`);
const IPv6SegmentFormat = '(?:[0-9a-fA-F]{1,4})';
const IPv6AddressRegExp = new RegExp('^('
  + `(?:${IPv6SegmentFormat}:){7}(?:${IPv6SegmentFormat}|:)|`
  + `(?:${IPv6SegmentFormat}:){6}(?:${IPv4AddressFormat}|:${IPv6SegmentFormat}|:)|`
  + `(?:${IPv6SegmentFormat}:){5}(?::${IPv4AddressFormat}|(:${IPv6SegmentFormat}){1,2}|:)|`
  + `(?:${IPv6SegmentFormat}:){4}(?:(:${IPv6SegmentFormat}){0,1}:${IPv4AddressFormat}|(:${IPv6SegmentFormat}){1,3}|:)|`
  + `(?:${IPv6SegmentFormat}:){3}(?:(:${IPv6SegmentFormat}){0,2}:${IPv4AddressFormat}|(:${IPv6SegmentFormat}){1,4}|:)|`
  + `(?:${IPv6SegmentFormat}:){2}(?:(:${IPv6SegmentFormat}){0,3}:${IPv4AddressFormat}|(:${IPv6SegmentFormat}){1,5}|:)|`
  + `(?:${IPv6SegmentFormat}:){1}(?:(:${IPv6SegmentFormat}){0,4}:${IPv4AddressFormat}|(:${IPv6SegmentFormat}){1,6}|:)|`
  + `(?::((?::${IPv6SegmentFormat}){0,5}:${IPv4AddressFormat}|(?::${IPv6SegmentFormat}){1,7}|:))`
  + ')(%[0-9a-zA-Z-.:]{1,})?$');

const is = {};

is.class = (target) => (typeof target === 'function'
    && (/^class(?:\s|{)/.test(functionToString.call(target))
      || (/^.*classCallCheck\(/.test(fnBody(target)))) // babel.js
);

is.stream = (target) => target instanceof stream.Stream;

is.readableStream = (target) => this.stream(target) && typeof target._read === 'function' && typeof target._readableState === 'object';

is.writableStream = (target) => this.stream(target) && typeof target._write === 'function' && typeof target._writableState === 'object';

is.duplexStream = (target) => this.readableStream(target) && this.writableStream(target);

is.finite = (target) => Number.isFinite(target);

is.NaN = (target) => Number.isNaN(target);

is.boolean = (target) => typeof target === 'boolean';

is.null = (target) => target === null;

is.nullOrUndefined = (target) => target == null;

is.number = (target) => typeof target === 'number';

is.string = (target) => typeof target === 'string';

is.symbol = (target) => typeof target === 'symbol';

// eslint-disable-next-line no-void,valid-typeof
is.undefined = (target) => target === void 0;

is.object = (target) => typeof target === 'object' && target !== null;

is.function = (target) => typeof target === 'function';

is.buffer = (target) => Buffer.isBuffer(target);

is.generator = (target) => target
    && typeof target.next === 'function'
    && typeof target.throw === 'function';

is.generatorFunction = (target) => target
    && target.constructor
    && target.constructor.name === 'GeneratorFunction';

is.asyncFunction = (target) => target
    && target.constructor
    && target.constructor.name === 'AsyncFunction';

is.promise = (target) => target
    && typeof target.then === 'function';

is.int = (target) => is.number(target)
    && target % 1 === 0;

is.int32 = (target) => is.int(target)
    && target < MAX_INT_31
    && target >= -MAX_INT_31;

is.long = (target) => is.int(target)
    && (target >= MAX_INT_31 || target < -MAX_INT_31);

is.Long = (target) => this.object(target)
    && this.number(target.high)
    && this.number(target.low);

is.double = (target) => this.number(target)
    && !this.NaN(target)
    && target % 1 !== 0;

is.date = (target) => target instanceof Date;

is.regExp = (target) => target instanceof RegExp;

is.error = (target) => target instanceof Error;

is.array = (target) => Array.isArray(target);

is.primitive = (target) => target === null
    || typeof target === 'boolean'
    || typeof target === 'number'
    || typeof target === 'string'
    || typeof target === 'symbol' // ES6 symbol
    || typeof target === 'undefined';

/**
 * 從 https://github.com/manishsaraan/email-validator 複製過來
 */
is.email = (target) => {
  const tester = /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  if (!is.string(target)) return false;

  const emailParts = target.split('@');

  if (emailParts.length !== 2) return false;

  const account = emailParts[0];
  const address = emailParts[1];

  if (account.length > 64) return false;
  if (address.length > 255) return false;

  const domainParts = address.split('.');
  if (domainParts.some((part) => part.length > 63)) return false;

  return tester.test(target);
};

/**
 * 是否為頂級網域
 * 從 https://github.com/validatorjs/validator.js/blob/master/src/lib/isFQDN.js 複製過來
 */
is.FQDN = (target, options = {}) => {
  const default_fqdn_options = {
    require_tld: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_numeric_tld: false,
    allow_wildcard: false,
  };

  let str = (is.string(target)) ? String(target) : '';

  const _options = extend(true, options, default_fqdn_options);

  /* Remove the optional trailing dot before checking validity */
  if (_options.allow_trailing_dot && str[str.length - 1] === '.') {
    str = str.substring(0, str.length - 1);
  }

  /* Remove the optional wildcard before checking validity */
  if (_options.allow_wildcard === true && str.indexOf('*.') === 0) {
    str = str.substring(2);
  }

  const parts = str.split('.');
  const tld = parts[parts.length - 1];

  if (_options.require_tld) {
    // disallow fqdns without tld
    if (parts.length < 2) {
      return false;
    }

    if (
      !_options.allow_numeric_tld
      && !/^([a-z\u00A1-\u00A8\u00AA-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)
    ) {
      return false;
    }

    // disallow spaces
    if (/\s/.test(tld)) {
      return false;
    }
  }

  // reject numeric TLDs
  if (!_options.allow_numeric_tld && /^\d+$/.test(tld)) {
    return false;
  }

  return parts.every((part) => {
    if (part.length > 63) {
      return false;
    }

    if (!/^[a-z_\u00a1-\uffff0-9-]+$/i.test(part)) {
      return false;
    }

    // disallow full-width chars
    if (/[\uff01-\uff5e]/.test(part)) {
      return false;
    }

    // disallow parts starting or ending with hyphen
    if (/^-|-$/.test(part)) {
      return false;
    }

    if (!_options.allow_underscores && /_/.test(part)) {
      return false;
    }

    return true;
  });
};

/**
 * 是否為 IP
 * 支援 IP4, IP6
 * 從 https://github.com/validatorjs/validator.js/blob/master/src/lib/isIP.js 複製過來
 */
is.ip = (target, version = '') => {
  const versionString = (is.string(version)) ? String(version) : '';
  if (!versionString) {
    return is.ip(target, '4') || is.ip(target, '6');
  }
  if (versionString === '4') {
    return IPv4AddressRegExp.test(target);
  }
  if (versionString === '6') {
    return IPv6AddressRegExp.test(target);
  }
  return false;
};

/**
 * 是否為 url
 * 從 https://github.com/validatorjs/validator.js/blob/master/src/lib/isURL.js 複製過來
 */
is.url = (target, options = {}) => {
  const default_url_options = {
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: false,
    require_host: true,
    require_port: false,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
    allow_fragments: true,
    allow_query_components: true,
    validate_length: true,
    host_whitelist: [],
    host_blacklist: [],
    disallow_auth: false,
  };
  const wrapped_ipv6 = /^\[([^\]]+)](?::([0-9]+))?$/;

  function checkHost(host, matches = []) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      if (host === match || (is.regExp(match) && match.test(host))) {
        return true;
      }
    }
    return false;
  }

  let url = (is.string(target)) ? String(target) : '';

  if (!url || /[\s<>]/.test(url)) {
    return false;
  }
  if (url.indexOf('mailto:') === 0) {
    return false;
  }

  const _options = extend(true, options, default_url_options);

  if (_options.validate_length && url.length >= 2083) {
    return false;
  }

  if (!_options.allow_fragments && url.includes('#')) {
    return false;
  }

  if (!_options.allow_query_components && (url.includes('?') || url.includes('&'))) {
    return false;
  }

  let protocol; let auth; let host; let port; let port_str; let split; let ipv6;

  split = url.split('#');
  url = split.shift();

  split = url.split('?');
  url = split.shift();

  split = url.split('://');
  if (split.length > 1) {
    protocol = split.shift();
    if (_options.require_valid_protocol && _options.protocols.indexOf(protocol.toLowerCase()) === -1) {
      return false;
    }
  } else if (_options.require_protocol) {
    return false;
  } else if (url.slice(0, 2) === '//') {
    if (!_options.allow_protocol_relative_urls) {
      return false;
    }
    split[0] = url.slice(2);
  }
  url = split.join('://');

  if (url === '') {
    return false;
  }

  split = url.split('/');
  url = split.shift();

  if (url === '' && !_options.require_host) {
    return true;
  }

  split = url.split('@');
  if (split.length > 1) {
    if (_options.disallow_auth) {
      return false;
    }
    if (split[0] === '') {
      return false;
    }
    auth = split.shift();
    if (auth.indexOf(':') >= 0 && auth.split(':').length > 2) {
      return false;
    }
    const [user, password] = auth.split(':');
    if (user === '' && password === '') {
      return false;
    }
  }

  const hostname = split.join('@');

  port_str = null;
  ipv6 = null;
  const ipv6_match = hostname.match(wrapped_ipv6);
  if (ipv6_match) {
    host = '';
    // eslint-disable-next-line prefer-destructuring
    ipv6 = ipv6_match[1];
    port_str = ipv6_match[2] || null;
  } else {
    split = hostname.split(':');
    host = split.shift();
    if (split.length) {
      port_str = split.join(':');
    }
  }

  if (port_str !== null && port_str.length > 0) {
    port = parseInt(port_str, 10);
    if (!/^[0-9]+$/.test(port_str) || port <= 0 || port > 65535) {
      return false;
    }
  } else if (options.require_port) {
    return false;
  }

  if (is.array(_options.host_whitelist) && _options.host_whitelist.length) {
    return checkHost(host, _options.host_whitelist);
  }

  if (host === '' && !_options.require_host) {
    return true;
  }

  if (!is.ip(host) && !is.FQDN(host, options) && (!ipv6 || !is.ip(ipv6, '6'))) {
    return false;
  }

  host = host || ipv6;

  if (is.array(_options.host_blacklist) && _options.host_blacklist.length && checkHost(host, _options.host_blacklist)) {
    return false;
  }

  return true;
};

module.exports = is;
