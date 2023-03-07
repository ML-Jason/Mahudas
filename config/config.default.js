const config = {
  port: 8080,
  static: {
    dir: 'app/public',
  },
  coreMiddleware: {
    /**
     * koa-bodyParser
     * https://www.npmjs.com/package/koa-bodyparser
     * 將接收的檔案大小拉高到100mb
     */
    bodyParser: {
      enable: true,
      package: 'koa-bodyparser',
      config: {
        jsonLimit: '100mb',
        textLimit: '100mb',
      },
    },
    /**
     * 使用helmet進行基本的安全性保護。
     * https://www.npmjs.com/package/koa-helmet
     * 關閉helmet的CSP，否則很多js會無法運作。
     * 設定referrerPolicy為'no-referrer-when-downgrade'，否則有時會有些script或圖片出現錯誤。
     * 關閉crossOriginEmbedderPolicy，否則html會無法引用第三方js。
     */
    helmet: {
      enable: true,
      package: 'koa-helmet',
      config: {
        contentSecurityPolicy: false,
        referrerPolicy: { policy: 'no-referrer-when-downgrade' },
        crossOriginEmbedderPolicy: false,
      },
    },
  },
  logger: {
    logDir: 'logs',
    outputFile: true,
    rotate: {
      datePattern: 'YYYY_MM_DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '7d',
    },
  },
};

module.exports = config;
