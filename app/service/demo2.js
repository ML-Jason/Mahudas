module.exports = (ctx) => {
  const test = async () => `${ctx.originalUrl} - this service returns an object which defines functions`;
  return {
    test,
  };
};
