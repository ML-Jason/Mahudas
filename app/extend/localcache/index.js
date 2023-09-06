const LocalCache = require('./localcache_class');

const _cachePool = new Map();

/*
使用 app.localCache.createPool(name) 來建立一個 cachePool
回傳一個 LocalCache 的 instance
*/
const createPool = (name, { maxSize, defaultTTL } = {}) => {
  const _instance = new LocalCache({ maxSize, defaultTTL });
  _cachePool.set(name, _instance);

  return _instance;
};

const getPool = (name) => _cachePool.get(name);

/*
刪除一個 cachePool
需要呼叫 instance.close() 來終止cache的tick並清除所有的資料與reference
*/
const deletePool = (name) => {
  const _instance = _cachePool.get(name);
  if (_instance) {
    _instance.close();
    _cachePool.delete(name);
  }
};

module.exports = {
  createPool,
  getPool,
  deletePool,
};
