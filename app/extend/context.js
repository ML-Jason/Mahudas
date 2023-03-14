module.exports = {
  runInBackground(scope) {
    const ctx = this;
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setImmediate(resolve))
      .then(() => scope(ctx))
      .catch((err) => {
        // eslint-disable-next-line no-param-reassign
        err.runInBackground = true;
        ctx.app.emit('onBackgroundError', err, ctx);
      });
  },
};
