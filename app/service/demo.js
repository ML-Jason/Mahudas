const { BaseContextClass } = global.app.CLASSES;

class Demo extends BaseContextClass {
  async test() {
    return `${this.ctx.originalUrl} - this service is a class`;
  }
}

module.exports = Demo;
