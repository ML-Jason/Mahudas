module.exports = (ctx) => {
  ctx.body = ctx.state.jwtPayload;
};
