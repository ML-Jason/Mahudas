module.exports = (ctx) => {
  ctx.service.user.logout();
  ctx.body = ctx.state.jwtPayload;
};
