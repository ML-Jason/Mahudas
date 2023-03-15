/*
預設的output
*/
const format = () => ({
  transform(info) {
    const { timestamp, message } = info;
    const label = info.label ? `[${info.label}]` : '';

    let output = `${timestamp} [${info.level}]${label} ${message}`;

    // 如果info.stack有值(表示是Error)，就把stack換行接到message之後
    if (info.stack) {
      output += `\n${info.stack}`;
    }

    return {
      ...info,
      [Symbol.for('message')]: output,
    };
  },
});

module.exports = format;
