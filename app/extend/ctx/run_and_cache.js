/**
 * 類似Dataloader，當一個ctx之下有多個程式同時需要執行同一個function時，
 * 為了避免重複的耗用資源(例如資料庫的讀取)，因此設計成function只被執行一次，
 * 當function執行完畢後再把資料返回給需要的程式。
 *
 * 在同一個ctx之下，執行完畢的資料也會暫時站存在runAndCache裡，後續再呼叫的話
 * 會優先從cache裡拿取。這一樣是為了減少過度讀取。
 *
 * Usage:
 *
 * 參數：
 * key - 用來當作cache的識別
 * fn - 要被執行的function
 * params - 要帶入fn的參數
 *
 * const rs = await ctx.runAndCache('addTwo', ctx.service.something, [1,2]);
 */

// 用程式啟動時的timestamp當作Symbol key值
// 這個Symbol會用來在ctx裡儲存runAndCache的資料
// 用Symbol+timstamp是為了減少相同property name彼此覆蓋的機率
const cacheSymbol = Symbol.for(`runAndCache${Date.now()}`);

// 這個function負責等待並監聽資料狀態
const waitForResponse = (cacheData) => new Promise((resolve) => {
  const timer = setInterval(() => {
    if (cacheData.status === 'run') return;
    clearInterval(timer);
    resolve(cacheData.data);
  }, 2);
});

async function runAndCache(key, fn, params = []) {
  const ctx = this;
  const { is } = ctx.app.utils;

  if (!key) throw new Error('[runAndCache] needs a key');
  if (!is.function(fn)) throw new Error('[runAndCache] invalid function');

  // cacheMap會儲存同一個ctx之下，runAndCache執行的狀態與資料
  if (!ctx[cacheSymbol]) ctx[cacheSymbol] = new Map();
  const cacheMap = ctx[cacheSymbol];

  // 處理傳入的參數，準備pass給function使用
  let passParams = params;
  if (!is.nullOrUndefined(params) && !is.array(params)) passParams = [params];

  // 把key跟參數串成一個給cacheMap用的key值
  // 加上參數當成key值是為了確保不同的參數之下不會回傳相同的cache
  const cacheKey = JSON.stringify({
    key,
    params: passParams,
  });
  let cacheData = cacheMap.get(cacheKey);
  if (!cacheData) {
    cacheData = {
      status: 'wait',
      data: null,
    };
    cacheMap.set(cacheKey, cacheData);
  }

  if (cacheData.status !== 'wait') {
    // 如果已經在執行，就等待結束
    if (cacheData.status === 'run') {
      await waitForResponse(cacheData);
    }
    // 如果已經執行完畢，直接回傳資料
    if (cacheData.status === 'complete') return cacheData.data;

    // 如果有錯誤，直接throw
    if (cacheData.status === 'error') throw cacheData.error;
  }

  // 執行function
  // 完畢後修改status並把資料回存到cacheMap
  cacheData.status = 'run';
  let rs;
  try {
    rs = await fn(...passParams);
  } catch (e) {
    cacheData.status = 'error';
    cacheData.error = e;
    throw e;
  }
  cacheData.data = rs;
  cacheData.status = 'complete';
  return rs;
}

module.exports = runAndCache;
