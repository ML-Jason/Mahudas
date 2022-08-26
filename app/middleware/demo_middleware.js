module.exports = (app) => {
  const demo = async (ctx, next) => {
    ctx.locals = 'passing value';
    next();
  };
  return demo;
};
