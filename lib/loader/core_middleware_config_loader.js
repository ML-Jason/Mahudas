/* eslint global-require:0, import/no-dynamic-require:0 */

const run = (app) => {
  Object.entries(app.config.coreMiddleware).forEach(([, item]) => {
    if (!item.enable) return;
    let middleware;
    try {
      middleware = require(item.package);
    } catch (e) {
      throw new Error(`package [${item.package}] not found! try \`npm i ${item.package}\``);
    }

    if (Object.prototype.hasOwnProperty.call(item, 'config')) {
      app.use(middleware(item.config));
    } else {
      app.use(middleware());
    }
  });
};

module.exports = run;
