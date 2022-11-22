module.exports = function logout() {
  this.ctx.state.jwtPayload = {};
};
