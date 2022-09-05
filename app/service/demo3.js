module.exports = (ctx) => {
  const test = async () => `${ctx.originalUrl} - this service is simply a function`;
  return test;
};
