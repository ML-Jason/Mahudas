/*
一個沒有format，完全silent的transport。
當console及file都設為none的時候使用。
*/
const { transports } = require('winston');

const get = () => {
  const transport = new transports.Console({
    format: {
      transform() {
        return false;
      },
    },
  });
  return transport;
};

module.exports = get;
