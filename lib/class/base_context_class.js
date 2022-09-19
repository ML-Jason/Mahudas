class BaseContextClass {
  constructor(ctx) {
    const { app } = global;
    if (ctx) {
      this.ctx = ctx;
    } else {
      this.ctx = app.createContext({}, {});
    }
    this.app = this.ctx.app;
    this.config = this.app.config;
  }
}

module.exports = BaseContextClass;
