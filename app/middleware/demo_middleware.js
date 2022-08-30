module.exports = (app) => {
  const demo = async (ctx, next) => {
    ctx.locals = 'passing value';
    await next();
  };
  return demo;
};
