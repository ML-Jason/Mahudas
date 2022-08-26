module.exports = (app) => {
  const { controller, router, middlewares } = app;

  router.get(['/demo', '/demo/(.*)'], middlewares.demoMiddleware, controller.demo);
};
