const cluster = require('cluster');
const path = require('path');
const { ORDER_DEFAULT } = require('../constants');

const T_SOURCES = 'sources';
const T_PROVIDERS = 'providers';
const T_SCHEMAS = 'schemas';
const T_ATTRIBUTES_SCHEMAS = 'attributes_schemas';
const T_PROVIDER_ACCOUNTS = 'provider_accounts';
const T_PROVIDER_CREDENTIALS = 'provider_credentials';
const T_MIGRATIONS = 'migrations';

const COUNT_PREFIX = '_count__';

const PKEY_SUFFIX = '_pkey';
const FKEY_SUFFIX = '_fkey';
const IDX_SUFFIX = '_idx';

const RELATION_STATISTICS_TABLE_PREFIX = '_rs__';
const DETAIL_STATISTICS_TABLE_PREFIX = '_ds__';
const ANCHOR_TABLE_PREFIX = '_a__';
const DETAIL_TABLE_PREFIX = '_d__';
const RELATION_TABLE_PREFIX = '_r__';
const RELATION_TABLE_SEPARATOR = '__';

// DB
const PG_CONN_CRED = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
  user: process.env.POSTGRES_USER || 'rsl',
  password: process.env.POSTGRES_PASSWORD || 'rsl',
  database: process.env.POSTGRES_DB || (
    (process.env.NODE_ENV === 'test') ? 'rsl_test' : 'rsl'
  ),
};
if (cluster.isMaster) {

  process.stderr.write(`host: ${PG_CONN_CRED.host} DB: ${PG_CONN_CRED.database}\n`);
}
const PG_MIGRATIONS_PATH = path.join(__dirname, '../../migrations');

const DB_RESET_TIMEOUT_MS = 3 * 1000;
const DEFAULT_QUERY_OPTIONS = {
  before: null,
  after: null,
  limit: 100,
  all: false,
  order: ORDER_DEFAULT,
};
const DB_RECONNECT_IN_MS = 3 * 1000;
const DB_RECONNECT_MAX_ATTEMPTS = 13;
const PGP_INIT_OPTIONS = {};
const PG_DEFAULT_DATABASE = 'postgres';
module.exports = {
  PG_DEFAULT_DATABASE,
  PGP_INIT_OPTIONS,
  DB_RECONNECT_IN_MS,
  DB_RECONNECT_MAX_ATTEMPTS,
  DB_RESET_TIMEOUT_MS,
  T_MIGRATIONS,
  PG_MIGRATIONS_PATH,
  T_ATTRIBUTES_SCHEMAS,
  T_SOURCES,
  T_PROVIDERS,
  T_SCHEMAS,
  T_PROVIDER_ACCOUNTS,

  DEFAULT_QUERY_OPTIONS,
  PG_CONN_CRED,
  ANCHOR_TABLE_PREFIX,
  DETAIL_TABLE_PREFIX,
  RELATION_TABLE_PREFIX,
  RELATION_TABLE_SEPARATOR,
  COUNT_PREFIX,
  T_PROVIDER_CREDENTIALS,
  PKEY_SUFFIX,
  FKEY_SUFFIX,
  IDX_SUFFIX,
  RELATION_STATISTICS_TABLE_PREFIX,
  DETAIL_STATISTICS_TABLE_PREFIX,
};
