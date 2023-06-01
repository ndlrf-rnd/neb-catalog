const pgPromise = require('pg-promise');
const { attachMonitor } = require('./monitor');
const {
  // DROP_CONNECTIONS,
  BOOTSTRAP_PROVIDER_ACCOUNTS,
  BOOTSTRAP_EXTENSIONS,
  BOOTSTRAP_SOURCES,
  BOOTSTRAP_PROVIDERS,
  BOOTSTRAP_DATA,
  RESET_BASE,
  ENTITY,
  ENTITY_NAME,
} = require('./queries');

const {
  T_PROVIDERS,
  T_SOURCES,
  T_MIGRATIONS,
  T_PROVIDER_ACCOUNTS,
  PG_CONN_CRED,
  RELATION_TABLE_SEPARATOR,
  RELATION_TABLE_PREFIX,
  RELATION_STATISTICS_TABLE_PREFIX,
  DETAIL_STATISTICS_TABLE_PREFIX,
  DETAIL_TABLE_PREFIX,
  ANCHOR_TABLE_PREFIX,
  DB_RESET_TIMEOUT_MS,
  PGP_INIT_OPTIONS,
} = require('./constants');
const { BASIC_ENTITIES } = require('../constants');

const {
  BOOTSTRAP_LRO,
  LRO_DROP,
} = require('../services/lro/constants');

const {
  error,
  info,
  warn,
  debug,
  cpMap,
  set,
  forceArray,
} = require('../utils');

// Init PGP

global.RECONNECT_TIMEOUT = null;
global.DB = null;
global.DB_ENTITIES_CACHE = null;
global.DB_TABLES_CACHE = null;
global.DB_RECONNECT_ATTEMPTS = 0;
global.ATTACHED = false;
const getDb = async () => {
  if (!global.DB) {
    if (process.env.DEBUG_DB) {
      if (!global.ATTACHED) {
        attachMonitor(PGP_INIT_OPTIONS);
        global.ATTACHED = true;
      }
    }
    global.reconnect = async () => {
      global.DB_RECONNECT_ATTEMPTS += 1;
      clearTimeout(global.RECONNECT_TIMEOUT);
      global.RECONNECT_TIMEOUT = null;
      global.DB_RECONNECT_ATTEMPTS = 0;
      info(`[DB] Successfully connected`);
    };
    const onLost = (err, e) => {
      if (err) {
        error(err, e, `[DB] Disconnected due error with message: ${err.message} and stack:\n----------\n${err.stack}\n----------\nNo reconnection attempts were performed, exiting with code -1`);
        process.exit(-1)
        // throw (err)
      } else {
        info(err, e, `[DB] Disconnected. No reconnection attempts were performed`);
      }
    };
    if (!global.PGP) {
      global.PGP = pgPromise({
        ...PGP_INIT_OPTIONS,
        error: onLost,
      });
    }
    if (!global.DB) {
      PG_CONN_CRED.database = process.env.POSTGRES_DB || ((process.env.NODE_ENV === 'test') ? 'rsl_test' : 'rsl');

      global.DB = global.PGP(PG_CONN_CRED);
    }
  }
  return global.DB;
};

const endDb = (connection = null) => {
  if (connection && (typeof connection.end === 'function')) {
    connection.end();
  } else {
    global.PGP.end();
  }
};

const bootstrap = async (db = null) => {
  db = db || await getDb();
  return new Promise(
    (resolve, reject) => cpMap(
      [
        {
          message: 'Setting up DB extensions',
          query: BOOTSTRAP_EXTENSIONS,
        },
        {
          message: 'Setting up data sources',
          query: BOOTSTRAP_SOURCES,
        },
        {
          message: 'Setting up data providers',
          query: BOOTSTRAP_PROVIDERS,
        },
        {
          message: 'Setting up data providers accounts',
          query: BOOTSTRAP_PROVIDER_ACCOUNTS,
        },
        {
          message: 'Inserting default records',
          query: BOOTSTRAP_DATA,
        },
        {
          message: 'Setting up model for long-running operations engine',
          query: BOOTSTRAP_LRO,
        },
        ...Object.keys(BASIC_ENTITIES).sort().map(
          (kind) => ({
            message: `Creating physical schema for basic entity: "${kind}"`,
            query:
              ENTITY(ENTITY_NAME(kind)),
          }),
        ),
      ],
      async ({ message, query }) => {
        process.stderr.write(`${message}...`);
        await db.oneOrNone(query);
        process.stderr.write(` done\n`);
      },
    ).catch(
      (err) => {
        error(err);
        reject(err);
      },
    ).then(
      () => resolve(),
    ),
  );
};

const teardown = (force = false, db) => new Promise(
  (resolve, reject) => {
    const doIt = () => (
      db ? Promise.resolve(db) : getDb()
    ).then(
      (db) => cpMap(
        [
          LRO_DROP,
        ],
        async (q) => {
          debug(q);
          return db.manyOrNone(q);
        },
      ).catch(
        (err) => {
          error('Error while bootstrapping orm', err);
          reject(err);
        },
      ).then(resolve),
    );

    if (force) {
      doIt().catch(reject).then(resolve);
    } else {
      let countDown = Math.floor(DB_RESET_TIMEOUT_MS / 1000);
      process.stderr.write(`WARNING Resetting DB in ${DB_RESET_TIMEOUT_MS / 1000} seconds, press CTRL+C to cancel...`);
      const countdownInterval = setInterval(
        () => {
          countDown -= 1;
          if (countDown === 0) {
            process.stderr.write(' 0\n');
            clearInterval(countdownInterval);
            doIt().catch(reject).then(resolve);
          } else {
            process.stderr.write(` ${countDown}...`);
          }
        },
        1000,
      );
    }
  },
);

const reset = async (force) => {
  await teardown(force);
  return bootstrap();
};

/**
 * Tables structure
 * @returns {Promise<{details: *, anchors: *, relations: *}>}
 */
const describeTables = async (renewCache = true) => {
  const db = await getDb();
  if (renewCache || (!global.DB_TABLES_CACHE)) {
    const tables = await db.manyOrNone(
      `SELECT pg_class.relname, pg_class.reltuples, pg_class.relkind FROM pg_class
     WHERE
      (
        pg_class.relkind IN ('m', 'r')
      ) AND (
        (pg_class.relname LIKE '\\__\\_\\_%')
          OR (pg_class.relname LIKE '\\__s\\_\\_%') 
          OR (pg_class.relname IN ('${T_SOURCES}', '${T_PROVIDERS}', '${T_PROVIDER_ACCOUNTS}', '${T_MIGRATIONS}'))
     ) ORDER BY pg_class.relname;`,
    );

    global.DB_TABLES_CACHE = tables.reduce(
      (a, o) => {
        let tClass = 'service';
        if (o.relname.startsWith(RELATION_TABLE_PREFIX)) {
          tClass = 'relations';
        } else if (o.relname.startsWith(ANCHOR_TABLE_PREFIX)) {
          tClass = 'anchors';
        } else if (o.relname.startsWith(DETAIL_TABLE_PREFIX)) {
          tClass = 'details';
        } else if (o.relname.startsWith(RELATION_STATISTICS_TABLE_PREFIX)) {
          tClass = 'relations_stat';
        } else if (o.relname.startsWith(DETAIL_STATISTICS_TABLE_PREFIX)) {
          tClass = 'details_stat';
        }
        const isRelation = o.relname.match(RELATION_TABLE_PREFIX) || o.relname.match(RELATION_STATISTICS_TABLE_PREFIX);
        const v = o.relname.replace(/^(_[^_]{1,2}__)(.+)(_[^_]key|_+idx_.+)?$/uig, '$2');
        return {
          ...a,
          [tClass]:
            [
              ...(a[tClass] || []),
              {
                count: o.reltuples,
                table: o.relname,
                ...(
                  isRelation
                    ? { kinds: v.replace(RELATION_TABLE_PREFIX, '').split(RELATION_TABLE_SEPARATOR) }
                    : { kind: v }
                ),
              },
            ],
        };
      },
      {
        relations: [],
        relations_stat: [],
        anchors: [],
        details: [],
        details_stat: [],
      },
    );
  }
  return global.DB_TABLES_CACHE;
};

const describeDbEntities = async (useCache = false) => {
  // if (useCache !== true) {
  //   global.DB_ENTITIES_CACHE = null;
  // }
  // if (!global.DB_ENTITIES_CACHE) {
  const dt = await describeTables(!useCache);
  const { anchors, details, relations, relations_stat, details_stat } = dt;
  const entities = {}
  anchors.forEach((det) => {
    set(entities, [det.kind, 'count'], det.count);
    set(entities, [det.kind, 'table'], det.table);
  });
  details_stat.forEach((det) => {
    set(entities, [det.kind, 'stat', 'count'], det.count);
    set(entities, [det.kind, 'stat', 'table'], det.table);
  });
  details.forEach((det) => {
    set(entities, [det.kind, 'details', 'count'], det.count);
    set(entities, [det.kind, 'details', 'table'], det.table);
  });
  relations.forEach((rel) => {
    set(entities, [rel.kinds[0], 'outgoing', rel.kinds[1], 'count'], rel.count);
    set(entities, [rel.kinds[0], 'outgoing', rel.kinds[1], 'table'], rel.table);

    set(entities, [rel.kinds[1], 'incoming', rel.kinds[0], 'count'], rel.count);
    set(entities, [rel.kinds[1], 'incoming', rel.kinds[0], 'table'], rel.table);
  });
  relations_stat.forEach((rel) => {
    set(entities, [rel.kinds[0], 'outgoing', rel.kinds[1], 'stat', 'count'], rel.count);
    set(entities, [rel.kinds[0], 'outgoing', rel.kinds[1], 'stat', 'table'], rel.table);

    set(entities, [rel.kinds[1], 'incoming', rel.kinds[0], 'stat', 'count'], rel.count);
    set(entities, [rel.kinds[1], 'incoming', rel.kinds[0], 'stat', 'table'], rel.table);
  });
  return entities;
};

process.on(
  'beforeExit',
  (code) => {
    if ((!!global.PGP) && (!!global.DB)) {
      process.stderr.write('Process beforeExit terminating DB connections...');
      global.PGP.end();
      process.stderr.write(' done.\nBye!\n');
    }
    process.exit(code);
  },
);

module.exports = {
  bootstrap,
  getDb,
  endDb,
  teardown,
  reset,
  describeDbEntities,
  describeTables,
};
