const path = require('path');
const Mahudas = require('../index');

let appInstance;

const waitForServer = () => new Promise((resolve) => {
  if (appInstance) {
    resolve(appInstance);
    return;
  }
  const app = new Mahudas({
    root: path.join(__dirname),
  });
  app.on('serverDidReady', () => {
    // console.log(app.getAppStructure());
    appInstance = app;
    resolve(app);
  });
});

module.exports = waitForServer;
