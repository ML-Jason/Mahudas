module.exports = (app) => {
  const {
    middleware, controller, router,
  } = app;

  router.get(
    ['/get_payload', '/get_payload/(.*)'],
    middleware.payload,
    controller.getPayload,
  );

  router.post(
    '/echo',
    controller.echo.echoResponse,
  );

  router.post(
    '/logout',
    middleware.payload,
    controller.logout,
  );
};
