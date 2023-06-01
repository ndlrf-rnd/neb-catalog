const cluster = require('cluster');
const { PG_DEFAULT_DATABASE } = require('../dao/constants');
const {
  DB_RESET_TIMEOUT_MS,
  PGP_INIT_OPTIONS,
  PG_CONN_CRED,
} = require('../dao/constants');
const { attachMonitor } = require('../dao/monitor');

const pgp = require('pg-promise')();

const resetDb = async (force = false) => {
  const db = pgp({
    ...PG_CONN_CRED,
    database: PG_DEFAULT_DATABASE, // Don't connect to databased supposed to reset
  });

  attachMonitor(PGP_INIT_OPTIONS);

  if (!force) {
    process.stderr.write('WARNING! MAIN DATABASE AND ALL RELATED DATA WILL BE DELETED SOON!\n');
    process.stderr.write('Interrupt process with CTRL+C or use kill to stop it.\n');
    process.stderr.write(`Waiting for ${DB_RESET_TIMEOUT_MS / 1000} seconds now ...\n`);
    await (new Promise(
      (resolve) => setTimeout(resolve, DB_RESET_TIMEOUT_MS),
    ));
  }
  process.stderr.write(` Suspending connections to ${PG_CONN_CRED.database} ...\n`);
  await db.any(`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE (pid <> pg_backend_pid())
  ;`);
  process.stderr.write(` Dropping database ${PG_CONN_CRED.database} ...\n`);
  await db.none(
    `DROP DATABASE IF EXISTS $1:name;`,
    [PG_CONN_CRED.database],
  );

  process.stderr.write(`Re-creating database "${PG_CONN_CRED.database}" with owner "${PG_CONN_CRED.user}"\n`);
  await db.none(`
    CREATE DATABASE $1:name
      WITH OWNER $2
      ENCODING 'UTF8'
      TEMPLATE = template0;`,
    [
      PG_CONN_CRED.database,
      PG_CONN_CRED.user,
    ],
  );
};

if (cluster.isMaster && (require.main === module)) {
  resetDb().catch(err => {
    process.stderr.write(`ERROR: ${err.message}\n${err.stack}\n`);
    process.exit(-1);
  }).then(() => {
    process.stderr.write('DB reset completed successfully, exiting now.\n');
    process.exit(0);
  });
}

module.exports = { resetDb };
