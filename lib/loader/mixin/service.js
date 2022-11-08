const path = require('path');

module.exports = {
  loadService(startPath) {
    // 掃描service目錄
    const scanPath = path.join(startPath || this.app.appInfo.root, 'app', 'service');
    return this.recursiveSearch(scanPath);
  },
};
