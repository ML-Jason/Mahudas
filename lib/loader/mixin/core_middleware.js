/* eslint global-require:0, import/no-dynamic-require:0 */

module.exports = {
  loadCoreMiddleware() {
    Object.entries(this.app.config.coreMiddleware).forEach(([, item]) => {
      if (!item.enable) return;
      try {
        const middleware = require(item.package);

        if (Object.prototype.hasOwnProperty.call(item, 'config')) {
          this.app.use(middleware(item.config));
        } else {
          this.app.use(middleware());
        }
      } catch (e) {
        throw new Error(`package [${item.package}] not found! try \`npm i ${item.package}\``);
      }
    });
  },
};
