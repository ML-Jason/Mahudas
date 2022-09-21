module.exports = {
  test: async () => 'arrow functions can\'t access ctx',

  async test2() {
    return `${this.ctx.originalUrl} - simply function and can access ctx`;
  },
};
