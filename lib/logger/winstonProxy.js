const is = require('../../app/extend/utils/is');

module.exports = {
  get(target, propKey) {
    const propKeys = ['info', 'debug', 'error', 'warn'];
    const formatRegExp = /%[scdjifoO%]/g;
    if (propKeys.includes(propKey)) {
      const method = target[propKey];
      return function handler(...args) {
        // 處理如果第一個參數是 object，裏面有 key 是 winston 的參數(message, splat..)，那就會被 winston 拿去使用
        if (args.length >= 1 && is.object(args[0])) {
          const newArgs = ['%j', ...args];
          return method.apply(this, newArgs);
        }

        // 處理如果第二個參數是 object，裏面有 key = message，會被 winston 強制加進第一個參數後
        if (args.length > 1 && is.string(args[0]) && !args[0].match(formatRegExp) && is.object(args[1])) {
          const newArgs = [`${args[0]} %O`, ...args.slice(1)];
          return method.apply(this, newArgs);
        }

        return method.apply(this, args);
      };
    }

    return target[propKey];
  },
};
