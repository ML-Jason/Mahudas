module.exports = {
  /**
   * usage:
   *
   * 1. 傳入Promise:
   * const someFunction = async () => { do something here };
   * ctx.runInBackground(someFunction());
   *
   * 2. 傳入function與參數
   * ctx.runInBackground(async (p1, p2)=> { do something here }, [param1, param2]);
   */
  runInBackground(scope, params = []) {
    const ctx = this;
    const { coreLogger, utils } = ctx.app;
    const { is } = utils;

    if (is.promise(scope)) coreLogger.warn('\x1B[33m▉ RunInBackground not recommended use Promise, which may cause the execution order to be different from what is expected!\x1B[0m');

    const onError = (err) => {
      // eslint-disable-next-line no-param-reassign
      err.runInBackground = true;
      ctx.app.emit('onBackgroundError', err, ctx);
    };

    const dealScope = () => {
      // 處理傳入的參數，準備pass給function使用
      let passParams = params;
      if (!is.nullOrUndefined(params) && !is.array(params)) passParams = [params];

      // 如果傳入的是一個Async function
      // 將params傳入給scope執行，並等待catch
      if (is.asyncFunction(scope)) {
        scope(...passParams).catch(onError);
        return;
      }

      // 如果是一般function，直接用try...catch包起來執行
      if (is.function(scope)) {
        try {
          const rs = scope(...passParams);
          // 如果function執行後是回傳一個promise，也要把錯誤接起來
          if (is.promise(rs)) {
            rs.catch(onError);
          }
        } catch (err) {
          onError(err);
        }
      }
    };

    if (!scope) return null;

    // 如果傳入的是Promise，等待catch就好
    if (is.promise(scope)) {
      scope.catch(onError);
      return null;
    }

    return new Promise((resolve) => {
      setImmediate(resolve);
    })
      .then(() => {
        dealScope();
      });
  },
};
