const cluster = require('cluster');
const { wait } = require('./utils');
const { SERVICES_CONFIGS } = require('./constants');
const { PG_CONN_CRED } = require('./dao/constants');
const { defaults, error, info } = require('./utils');
const { migrate } = require('./dao/migrate');
const {
  getQueue,
  registerOperation,
} = require('./services/lro');

const { parseArgs } = require('./cli');
const { runCatalogServer } = require('./services/catalog');
const { importUrl } = require('./operations/importStream');
const { service } = require('./operations/service');

const { PG_MIGRATIONS_PATH } = require('./dao/constants');

const RUNNERS = {
  worker: async (config) => {
    try {
      await getQueue(true);
      info(`[SERVICE:LRO:WORKER:${process.pid}] Worker with ${config.jobs} jobs capacity is now online`);
    } catch (e) {
      error(e);
      throw e;
    }
  },
  catalog: runCatalogServer,
};

const runService = async (mode, config) => {
  const serverConfig = defaults(config, SERVICES_CONFIGS[mode]);
  const runner = RUNNERS[mode];
  if (runner) {
    try {
      await wait(SERVICES_CONFIGS[mode].startDelayMs || 0);
      return runner(serverConfig);
    } catch (e) {
      error(`[SERVICE:LAUNCHER] ERROR: ${e.message}\n ${e.stack}`);
      process.exit(-1);
    }
  } else {
    error(`[SERVICE:LAUNCHER] Invalid service mode: "${mode}"`);
    process.exit(-1);
  }
};


registerOperation('import', importUrl);
registerOperation('service', service);

/**
 * SID Main Entry Pint
 */
if (cluster.isMaster && (require.main === module)) {

  let config = parseArgs(process.argv.slice(2));
  let initPromise = Promise.resolve();
  if (config.migrate) {
    initPromise.then(
      () => migrate(
        {
          pgConnCred: PG_CONN_CRED,
          pgMigrationsPath: PG_MIGRATIONS_PATH,
        },
      ).catch((e) => {
        error(e);
        process.exit(1);
      }),
    );
  }

  initPromise.then(
    () => runService(
      config.command,
      config,
    ).catch((e) => {
      error(e);
      process.exit(1);
    }),
  );
}

module.exports = {
  runService,
  RUNNERS,
};
