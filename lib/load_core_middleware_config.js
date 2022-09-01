/* eslint global-require:0, import/no-dynamic-require:0 */

const run = (app) => {
  app.config.coreMiddleware.forEach((coreMiddleware) => {
    if (!coreMiddleware.enable) return;

    const middleware = require(coreMiddleware.package);
    app.use(middleware(coreMiddleware.config));
  });
};

module.exports = run;
