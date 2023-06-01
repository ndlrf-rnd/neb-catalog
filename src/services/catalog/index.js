const yaml = require('js-yaml');
const http = require('http');
const express = require('express');
const { getQueue } = require('../lro');
const { info, warn, defaults } = require('../../utils');
const { OPDS2_CONFIG, DEBUG } = require('../../constants');

const runCatalogServer = async (options = {}, app) => {
  const { router } = require('./router');
  const o = defaults(options || {}, OPDS2_CONFIG);
  app = app || express();
  if (DEBUG) {

    info('=== Options ===');
    info(yaml.safeDump(o));
  }

  const server = http.createServer(app);

  return new Promise(
    (resolve, reject) => {
      getQueue(false).catch(reject).then(
        () => {
          warn('[SERVICE:CATALOG] Queue initialized');
          app.use('/', router);
          app.options('*', (req, res) => {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.send('ok');
          });
          server.listen(
            o.port,
            async () => {
              const hostUri = `${o.scheme}://${o.host}:${o.port}/`;
              const msg = `[SERVICE:CATALOG:${process.pid}] Service ready and listening on: ${hostUri}${hostUri === o.baseUri ? '' : ` -> ${o.baseUri}`}`;
              warn(msg);
              resolve({
                app,
                server,
                stop: () => new Promise((res) => server.close(res)),
              });
            },
          );
        },
      );
    },
  );
};

module.exports = {
  runCatalogServer,
};
