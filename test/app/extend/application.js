// 測試extend帶入app參數，測試是否可以讀取app.config
module.exports = (app) => {
  const getPORT = () => app.config.port;

  return {
    getPORT,
  };
};
