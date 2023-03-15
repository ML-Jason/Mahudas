module.exports = {
  /**
   * usage:
   *
   * 1. 傳入Promise:
   * const someFunction = async () => { do somthing here };
   * ctx.runInBackgroun(someFunction());
   *
   * 2. 傳入function與參數
   * ctx.runInBackgroun(async (p1, p2)=> { do somthing here }, [param1, param2]);
   */
  runInBackground(scope, params = []) {
    const ctx = this;

    const onError = (err) => {
      // eslint-disable-next-line no-param-reassign
      err.runInBackground = true;
      ctx.app.emit('onBackgroundError', err, ctx);
    };

    const dealScope = () => {
      // 處理傳入的參數，準備pass給function使用
      let passParams = params;
      if (params !== undefined && !Array.isArray(params)) passParams = [params];

      // 如果傳入的是一個Async function
      // 將params傳入給scope執行，並等待catch
      if (scope.constructor
      && scope.constructor.name === 'AsyncFunction') {
        scope(...passParams).catch(onError);
        return;
      }

      // 如果是一般function，直接用try...catch包起來執行
      if (typeof scope === 'function') {
        try {
          const rs = scope(...passParams);
          // 如果function執行後是回傳一個promise，也要把錯誤接起來
          if (rs && rs.then && typeof rs.then === 'function') {
            rs.catch(onError);
          }
        } catch (err) {
          onError(err);
        }
      }
    };

    if (!scope) return null;

    // 如果傳入的是Promise，等待catch就好
    if (scope.then && typeof scope.then === 'function') {
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
