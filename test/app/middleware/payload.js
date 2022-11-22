module.exports = () => async (ctx, next) => {
  ctx.state.jwtPayload = {
    email: 'mahudas@test.com',
  };
  await next();
};
