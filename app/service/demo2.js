module.exports = function onlyFunction() {
  const { ctx } = this;
  if (ctx) return `${ctx.originalUrl} - this service is simply a function`;
  return 'this service is simply a function and no ctx';
};
