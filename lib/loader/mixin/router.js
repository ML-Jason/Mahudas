/* eslint global-require:0, import/no-dynamic-require:0 */
const path = require('path');
const fs = require('fs');

module.exports = {
  loadRouter(startPath) {
    const filePath = path.join(startPath || this.app.appInfo.root, 'app', 'router', 'index.js');
    if (fs.existsSync(filePath)) {
      require(filePath)(this.app);
    }
  },
};
