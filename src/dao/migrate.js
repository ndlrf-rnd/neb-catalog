const pgPromise = require('pg-promise');

const path = require('path');
const fs = require('fs');
const { info, error, mkdirpSync } = require('../utils');
const PGMigrations = require('postgres-migrations');
const { PGP_INIT_OPTIONS } = require('./constants');
const { PG_CONN_CRED } = require('./constants');
const { hash } = require('../crypto/argon2');
const {
  DEFAULT_SOURCE,
  DEFAULT_PROVIDER,
  BASIC_ENTITIES,
} = require('../constants');
const { ENTITY, ENTITY_NAME } = require('./queries');
const { TIME_SYS_IDX } = require('./indexes');
const {
  PG_MIGRATIONS_PATH,
  PKEY_SUFFIX,
  T_PROVIDER_ACCOUNTS,
  T_PROVIDERS,
  T_SOURCES,
} = require('./constants');
const { BOOTSTRAP_LRO } = require('../services/lro/constants');

const BOOTSTRAP_EXTENSIONS = [
  'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
  'CREATE EXTENSION IF NOT EXISTS "btree_gist";',  // Important for PK indices
].join('\n');


/**
 * Data sources
 * @returns {string}
 * @constructor
 */
const BOOTSTRAP_SOURCES = `
CREATE TABLE IF NOT EXISTS ${T_SOURCES} (
    code        VARCHAR   NOT NULL,
    time_sys    TSRANGE   NOT NULL DEFAULT TSRANGE(NOW()::timestamp, NULL),
    metadata    JSONB,
    CONSTRAINT ${T_SOURCES}${PKEY_SUFFIX} PRIMARY KEY (code)
);
${TIME_SYS_IDX(T_SOURCES, [])}`;

/**
 * Data providers
 * @returns {string}
 * @constructor
 */
const BOOTSTRAP_PROVIDERS = `
CREATE TABLE IF NOT EXISTS ${T_PROVIDERS} (
    code        VARCHAR   NOT NULL,
    time_sys    TSRANGE   NOT NULL DEFAULT TSRANGE(NOW()::timestamp, NULL),
    metadata    JSONB,
    CONSTRAINT ${T_PROVIDERS}${PKEY_SUFFIX} PRIMARY KEY (code)
);
${TIME_SYS_IDX(T_PROVIDERS, [])}`;

const BOOTSTRAP_PROVIDER_ACCOUNTS = `
CREATE TABLE IF NOT EXISTS ${T_PROVIDER_ACCOUNTS} (
    provider        VARCHAR   NOT NULL REFERENCES ${T_PROVIDERS} (code),
    email           VARCHAR   NOT NULL,
    secret_hash     VARCHAR   NOT NULL,
    power           BOOLEAN   NOT NULL DEFAULT FALSE,
    time_sys        TSRANGE   NOT NULL DEFAULT TSRANGE(NOW()::timestamp, NULL),
    CONSTRAINT ${T_PROVIDER_ACCOUNTS}${PKEY_SUFFIX} PRIMARY KEY (provider, email, secret_hash)
);
${TIME_SYS_IDX(T_PROVIDER_ACCOUNTS, [])}`;

const makeCreateDefaultProviderSql = async (
  defaultProvider = DEFAULT_PROVIDER,
) => pgPromise(PGP_INIT_OPTIONS).helpers.concat([
  {
    query: `INSERT INTO ${T_PROVIDERS} (code) VALUES ($<provider>);`,
    values: defaultProvider,
  },
  {
    query: `INSERT INTO ${T_SOURCES} (code) VALUES ($<source>);`,
    values: { source: DEFAULT_SOURCE },
  },
  {
    query: `INSERT INTO ${T_PROVIDER_ACCOUNTS}
      (provider, email, secret_hash, power)
    VALUES
      ($<provider>, $<email>, $<secret_hash>, $<power>);`,
    values: {
      ...defaultProvider,
      secret_hash: await hash(defaultProvider.secret),
    },
  },
]);

const makeBasicDbMigrationFiles = async (pgMigrationsPath = PG_MIGRATIONS_PATH) => {
  fs.writeFileSync(
    path.join(pgMigrationsPath, '00001-create-db-extension.sql'),
    BOOTSTRAP_EXTENSIONS,
  );
  fs.writeFileSync(
    path.join(pgMigrationsPath, '00002-create-lro-tables.sql'),
    BOOTSTRAP_LRO,
    'utf-8',
  );
  fs.writeFileSync(path.join(pgMigrationsPath, '00003-create-service-tables.sql'),
    [
      {
        message: 'Data sources',
        query: BOOTSTRAP_SOURCES,
      },
      {
        message: 'Data providers',
        query: BOOTSTRAP_PROVIDERS,
      },
      {
        message: 'Data providers accounts',
        query: BOOTSTRAP_PROVIDER_ACCOUNTS,
      },
    ].map(({ message, query }) => `\n-- ${message}\m\n${query}\n\n`).join('\n\n'),
    'utf-8',
  );

  fs.writeFileSync(
    path.join(pgMigrationsPath, '00004-create-basic-entities-tables.sql'),
    Object.keys(BASIC_ENTITIES).sort().map(
      (kind) => ({
        message: `Entity kind: "${kind}"`,
        query:
          ENTITY(ENTITY_NAME(kind)),
      }),
    ).map(({ message, query }) => `\n-- ${message}\m\n${query}\n\n`).join('\n\n'),
    'utf-8',
  );

  fs.writeFileSync(
    path.join(pgMigrationsPath, '00005-insert-default-provider.sql'),
    await makeCreateDefaultProviderSql(DEFAULT_PROVIDER),
    'utf-8',
  );
};

const migrate = async ({ pgMigrationsPath }) => {
  info(`[MIGRATION:${process.pid}] Actualizing migrations using following files:\n${fs.readdirSync(pgMigrationsPath).map(v => `  - ${v}\n`).join('')}`);
  try {

    if (!fs.existsSync(pgMigrationsPath)) {
      mkdirpSync(pgMigrationsPath);
    }

    if (fs.readdirSync(pgMigrationsPath).length === 0) {
      await makeBasicDbMigrationFiles(pgMigrationsPath);
      info(
        [
          `[MIGRATION:${process.pid}] Basic migration files were created at: ${pgMigrationsPath}`,
          `Default provider (${DEFAULT_PROVIDER.provider}) account credentials:`,
          `${DEFAULT_PROVIDER.email}:${DEFAULT_PROVIDER.secret}`,
        ].join('\n'),
      );
    }
    await PGMigrations.createDb(
      PG_CONN_CRED.database,
      {
        ...PG_CONN_CRED,
        defaultDatabase: 'postgres', // defaults to "postgres"
      },
    );

    await PGMigrations.migrate(PG_CONN_CRED, PG_MIGRATIONS_PATH);
  } catch (e) {
    error(`[MIGRATION:${process.pid}] ERROR: ${e.message}\n${e.stack}`);
  }
};
module.exports = {
  migrate,
  makeBasicDbMigrationFiles,
};
