const { EventEmitter } = require('events');

/*
處理local cache機制的類別

基本上是Map()的延伸，只是加入了過期時間的判斷。
為了避免一直不斷的setInterval造成系統資源的浪費，
因此 LocalCache 的設計並不是用一個timer每秒鐘掃描cache資料，
而是在必要時才去計算下次要掃描的時間點。

過期資料掃描的時間點計算方式是依照:
1. 每當有資料進來時，計算它即將過期的時間，並設定一個setTimeout在目標時間觸發
2. setTimeout觸發時，呼叫_onTick清除以過期資料，並重新計算下一次的tick時間
3. 當cache資料都已經沒有(或是剩下的都是永久資料時)，setTimeout就會停止
4. 只要有新的資料進入，都會重新跑一次1-3的流程
*/
class LocalCache extends EventEmitter {
  /* eslint-disable lines-between-class-members */
  app = global.app;
  maxSize = 0; // 最多可儲存的數量，0表示不限制
  defaultTTL = 0; // 預設的過期時間(ms)，0表示不會過期
  _nextExpiredAt; // 用來記錄下一個準備要過期的時間
  _timer; // setTimeout的timer
  _cacheMap = new Map();
  /* eslint-enable lines-between-class-members */

  constructor({
    maxSize = 0,
    defaultTTL = 0,
  } = {}) {
    super();
    this.setOptions({ maxSize, defaultTTL });
  }

  setOptions({
    maxSize = 0,
    defaultTTL = 0,
  } = {}) {
    const { to } = this.app.utils;
    this.maxSize = to.number(maxSize) || 0;
    this.defaultTTL = to.number(defaultTTL) || 0;
  }

  // setTimeout 被觸發時會呼叫 _onTick
  // _onTick會清除過期資料
  _onTick() {
    clearTimeout(this._timer);

    const _now = Date.now();
    let nextTickMs = 0;
    // 掃描_cacheMap，將過期的物件移除
    // 並計算最靠近現在的下一筆即將過期的資料距離現在的時間點
    this._cacheMap.forEach((data, key) => {
      if (data.expiredAt) {
        if (data.expiredAt <= _now) {
          this.emit('expired', key, data.value);
          this._cacheMap.delete(key);
        } else {
          const _interval = data.expiredAt - _now;
          if (nextTickMs === 0
          || (nextTickMs > 0 && nextTickMs > _interval)) {
            nextTickMs = _interval;
          }
        }
      }
    });

    // 清除_nextExpiredAt，呼叫_updateNextExpired重新計算下次的tick時間
    this._nextExpiredAt = null;
    this._updateNextExpired(nextTickMs);
  }

  // 比對_nextExpiredAt的時間是不是比較後面
  // 如果是的話就將_nextExpiredAt的時間往前更新
  // 並重新啟動setTimeout
  _updateNextExpired(ttl) {
    if (ttl === 0) return;
    const expiredAt = Date.now() + ttl;

    if (!this._nextExpiredAt
      || this._nextExpiredAt > expiredAt) {
      clearTimeout(this._timer);
      this._nextExpiredAt = expiredAt;
      const _interval = expiredAt - Date.now();
      this._timer = setTimeout(() => {
        this._onTick();
      }, _interval);
    }
  }

  set(key, value, { ttl } = {}) {
    // 如果目前的size已經等於maxSize，表示無法再容納cache
    // 就發送maxSize事件，並不做任何事情
    if (this.maxSize > 0 && this._cacheMap.size >= this.maxSize) {
      this.emit('maxSize');
      return;
    }
    const { to, is } = this.app.utils;
    let _ttl = to.number(ttl) || 0;
    if (is.nullOrUndefined(ttl)) _ttl = this.defaultTTL;
    const _expiredAt = Date.now() + _ttl;

    const data = { value };
    if (_ttl > 0) {
      data.expiredAt = _expiredAt;
    }
    this._cacheMap.set(key, data);
    // 有新增的資料都要重新計算一次_nextExpiredAt
    this._updateNextExpired(_ttl);
  }

  get(key) {
    const data = this._cacheMap.get(key) || {};
    return data.value;
  }

  get size() {
    return this._cacheMap.size;
  }

  delete(key) {
    this._cacheMap.delete(key);
  }

  keys() {
    return Array.from(this._cacheMap.keys());
  }

  // 清除所有監聽與資料、停止timer
  close() {
    this.removeAllListeners();
    clearTimeout(this._timer);
    this._cacheMap.clear();
    this._cacheMap = null;
  }
}

module.exports = LocalCache;
