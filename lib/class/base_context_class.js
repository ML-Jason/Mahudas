// 判斷要載入的module是否為Class
const typeofModule = (module) => {
  if (typeof module === 'function') {
    if (/^class\s/.test(Function.prototype.toString.call(module))) return 'class';
    return 'function';
  }
  return 'object';
};

class BaseContextClass {
  constructor(ctx, subModules = new Map()) {
    const { app } = global;
    if (ctx) {
      this.ctx = ctx;
    } else {
      this.ctx = app.createContext({}, {});
    }
    this.app = this.ctx.app;
    this.config = this.app.config;

    // 儲存instance的暫存，以nameSpace為key值儲存instance
    // 確保每個ctx階段不會產生兩個同樣的instance
    this.instanceCache = new Map();

    // 建立一個變數來儲存此module以下是否仍然有巢狀結構的sub modules
    const subModuleMap = new Map();

    // 掃描sub module
    subModules.forEach((value, key) => {
      // 取得下一個sub module的第一個namespace
      const subName = key.split('.')[0];
      // 從傳入的subModules裡判斷此namespace是否為已經載入的模組
      // 如果沒有被載入的模組，那就表示此namespace之下仍然有巢狀的結構
      // 則將巢狀結構儲存到subModuleMap裡，繼續往下傳遞到下一個 BaseContextClass
      const Loaded = subModules.get(subName);
      if (!Loaded) {
        const mapItem = subModuleMap.get(subName) || new Map();
        mapItem.set(key.replace(`${subName}.`, ''), subModules.get(key));
        subModuleMap.set(subName, mapItem);
        return;
      }

      // 判斷載入的模組是屬於class/function/object
      const moduleTypeof = typeofModule(Loaded);

      // 如果是class，則給予getter
      if (moduleTypeof === 'class') {
        Object.defineProperty(this, subName, {
          get() {
            // 確定是否有cache，有則回傳cache
            if (this.instanceCache.get(subName)) return this.instanceCache.get(subName);
            const instance = new Loaded(ctx);
            this.instanceCache.set(subName, instance);
            return instance;
          },
        });
      }

      // 如果是function，直接將這個function binding到this
      if (moduleTypeof === 'function') {
        this[subName] = Loaded.bind(this);
      }

      // 如果是一個object，就給予一個getter，用來產生新的BaseContextClass，
      // 並將此object裡的function/properties賦予給新的instance
      if (moduleTypeof === 'object') {
        Object.defineProperty(this, subName, {
          get() {
            if (this.instanceCache.get(subName)) return this.instanceCache.get(subName);
            const instance = new BaseContextClass(ctx);
            this.instanceCache.set(subName, instance);

            const properties = Object.getOwnPropertyNames(Loaded);
            properties.forEach((v1) => {
              const descriptor = Object.getOwnPropertyDescriptor(Loaded, v1);
              Object.defineProperty(instance, v1, descriptor);
            });
            return instance;
          },
        });
      }
    });

    // 建立巢狀子服務的getter
    subModuleMap.forEach((value, key) => {
      Object.defineProperty(this, key, {
        get() {
          if (this.instanceCache.get(key)) return this.instanceCache.get(key);
          const instance = new BaseContextClass(ctx, subModuleMap.get(key));
          this.instanceCache.set(key, instance);
          return instance;
        },
      });
    });
  }
}

module.exports = BaseContextClass;
