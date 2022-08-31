module.exports = (app) => {
  const { controller, router, middleware } = app;

  router.get(['/demo', '/demo/(.*)'], middleware.demoMiddleware, controller.demo);
};
