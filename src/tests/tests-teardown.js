const { getDb } = require('../dao/db-lifecycle');
module.exports = async () => {

  if (global.server) {
    await global.server.stop();
    global.server = null;
  }

  if (global.q) {
    global.q.stop();
  }
  if ((await getDb()).end) {
    (await getDb()).end();
  }
};
