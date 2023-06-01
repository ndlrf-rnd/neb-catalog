/* eslint-disable quote-props */
const os = require('os');
const fs = require('fs');
const path = require('path');

const { BASIC_ENTITIES } = require('./recordTypes');

const PNG_MEDIA_TYPE = 'image/png';
const ORDER_DESC = 'desc';
const ORDER_ASC = 'asc';
const ORDER_DEFAULT = ORDER_DESC;
const FLAG_TRUE = 'true';
const FLAG_FALSE = 'false';
const CURSOR_ENCRYPTION_SECRET = 'D3aDb33f';
const ENCRYPT_CURSORS = false;
const DEFAULT_SCHEMA_MEDIA_TYPE = 'application/text';
const DEFAULT_SOURCE = process.env.DEFAULT_SOURCE || 'catalog.rusneb.ru';
const DEFAULT_PROVIDER = {
  power: true,
  provider: process.env.DEFAULT_PROVIDER || 'rusneb.ru',
  email: process.env.DEFAULT_PROVIDER_EMAIL || 'catalog@rusneb.ru',
  secret: process.env.DEFAULT_PROVIDER_SECRET || '13ac570f4cedb9b8ce7711a2c763b04e',
};
const PROVIDER_TOKEN_SIZE_BYTES = 16;

const PROVIDER_TOKEN_CYPHER = 'argon2';


const DEFAULT_JOBS = Math.max(
  2,
  parseInt(process.env.CATALOG_JOBS, 10) || os.cpus().length
);

const DEFAULT_CLUSTER_TASK_CTX = { jobs: DEFAULT_JOBS };
const MAX_POOL_PER_WORKER_SIZE_BYTES = 1024 * 1024;
const CLEANUP_SUCCESSFUL_IMPORT_FILES = true;
const CLEANUP_FAILED_IMPORT_FILES = false;
const LOGS_DIR = process.env.LOGS_DIR || path.join(__dirname, '../logs');
const DEFAULT_READ_STREAM_OPTIONS = {
  // highWaterMark: 4 * 1024 * 1024,
  encoding: 'utf-8',
};

const DEFAULT_SEARCH_INDEX = 'semantic-fasttext';

const DEFAULT_SEARCH_SERVER_OPTIONS = {
  'semantic-fasttext': {
    baseUri: 'http://neb-b-huge-storage-01.neb.rsl:1390',
    schema: {
      type: 'application/opds+json',
      rel: 'search',
      title: 'Search',
      href: '/search{?q,limit,e}',
      hrefSchema: {
        q: {
          title: 'Query',
          type: 'string',
          minLength: 1,
          maxLength: 4096,
        },
        limit: {
          title: 'Results count',
          type: 'integer',
          minimum: 1,
          default: 100,
          maximum: 1000,
        },
        e: {
          title: 'Graph traverse epsilon',
          type: 'float',
          minimum: 0.001,
          default: 0.13,
          maximum: 1.0,
        },
        entities: {
          title: 'Kinds of entities',
          type: 'array',
          items: {
            type: 'string',
            minLength: 1,
            maxLength: 4095,
          },
        },
      },
      method: 'GET',
      templated: true,
      templateRequired: [
        'query',
      ],
      targetSchema: {
        '$ref': 'https://drafts.opds.io/schema/feed.schema.json',
      },
      targetHints: {
        'allow': [
          'HEAD',
          'GET',
        ],
      },
    },
  },
};

const baseUri = process.env.CATALOG_BASE_URI || process.env.SEED_CATALOG_BASE_URI || (
  (process.env.NODE_ENV === 'test') ? 'http://localhost:8080' : (process.env.POSTGRES_HOST === 'catalog-postgresql.dev.neb.rsl' ? 'catalog-master.dev.neb.rsl' : 'https://catalog.rusneb.ru')
) || '';
const DEFAULT_URL_SCHEME = 'https';
let OPDS2_CONFIG;
OPDS2_CONFIG = {
  forceExtension: false,
  baseUri,
  startDelayMs: 1500, // 1 Sec later than a worker
  scheme: process.env.SEED_CATALOG_SCHEME || DEFAULT_URL_SCHEME,
  host: process.env.SEED_CATALOG_HOST || 'localhost',
  port: process.env.SEED_CATALOG_PORT || 8080,
  defaultExtension: 'json',
  defaultScheme: (process.env.POSTGRES_HOST === 'catalog-postgresql.dev.neb.rsl' ? 'http' : process.env.SEED_CATALOG_DEFAULT_SCHEME || 'https'),
  language: process.env.SEED_CATALOG_LANGUAGE || 'ru',
  defaultPageSize: parseInt(process.env.OPDS2_DEFAULT_PAGE_SIZE, 10) || 100,
  maxPageSize: parseInt(process.env.OPDS2_MAX_PAGE_SIZE, 10) || 10000,
  defaultMediaType: 'application/opds+json',
  publicationMediaType: 'application/webpub+json',
  resetCache: true,
  bodyParser: 'json',
  bodyParserConfig: {},
  statCountThreshold: 1,
  feedsCachePath: process.env.SEED_CATALOG_CACHE_PATH || path.join(__dirname, './.cache/db.feeds'),
  schemasPath: path.join(__dirname, './schemas'),
  staticPath: process.env.CATALOG_STATIC_PATH || process.env.SEED_CATALOG_STATIC_PATH || path.join(__dirname, './services/catalog/static'),
};

const WORKER_CONFIG = {
  jobs: DEFAULT_JOBS,
  startDelayMs: 500,
};

const SERVICES_CONFIGS = {
  worker: WORKER_CONFIG,
  catalog: OPDS2_CONFIG,
};

const X2J_OPTIONS = {
  ignoreComment: false,
  alwaysRoot: false,
  compact: true,
  alwaysChildren: false,
  alwaysArray: true,
  fullTagEmptyElement: false,
  trim: true,
  textKey: '_text',
  attributesKey: '_attributes',
  commentKey: '_comment',
};

/**
 * Fetch
 */
const FETCH_PARAMS = {
  highWaterMark: 512 * 1024, // default is 16384
  throttle: 10 * 1000,
  size: 256 * 1024 * 1024, // 1/4 GB
};

const FETCH_PROGRESS_PARAMS = {
  throttle: 10 * 1000,
};

const DEFAULT_DOWNLOAD_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.87 Safari/537.36',
  'Transfer-Encoding': 'chunked', // ! Important
};

const RESERVED_KINDS = ['docs', 'api-docs'];
const TYPOGRAF_OPTIONS = {
  // https://github.com/typograf/typograf/blob/dev/docs/using.md
  global: { locale: ['ru', 'en-US'] },
  // https://github.com/typograf/typograf/blob/dev/docs/api_attrs.md
  rules: [
    ['common/html/processingAttrs', 'attrs', ['title', 'placeholder', 'alt', 'my-attr']],
    ['common/nbsp/replaceNbsp'],
  ],
};

const MAPPING_ERROR_CTX_LINES = 3;
// const MODELS_PATH = process.env.MODELS_PATH || path.join(__dirname, '../.models');
const MEDIA_STORAGE_CONF = {
  cdnRewritePath: `/cdn/`,
  urlSignatureTtl: 7 * 24 * 60 * 60,
  retryAttempts: 13,
  retryAfterMs: 1300,
  defaultBucketName: 'rusneb.ru',
  S3: {
    ...(process.env.SID_MEDIA_REGION ? { region: process.env.SID_MEDIA_REGION } : {}),
    sessionToken: process.env.SEED_SESSION_TOKEN,
    port: process.env.SEED_MEDIA_PORT,
    useSSL: typeof process.env.SEED_MEDIA_USE_TLS !== 'undefined' ? (!!process.env.SEED_MEDIA_USE_TLS) : false,
    endPoint: process.env.SEED_MEDIA_ENDPOINT || 's3.ceph.neb.rsl',
    accessKey: process.env.SEED_MEDIA_ACCESS_KEY || '3BWEIZ7WB2EOCE28XP42',
    secretKey: process.env.SEED_MEDIA_SECRET_KEY || 'a35vnuoSAhMLozSD1YD6kGKzncKAUk47UFDuYuZC',
  },
  /*
  useSSL: typeof process.env.SEED_MEDIA_USE_TLS !== 'undefined' ? (!!process.env.SEED_MEDIA_USE_TLS) : (process.env.NODE_ENV !== 'test'),
    endPoint: process.env.SEED_MEDIA_ENDPOINT || (process.env.NODE_ENV === 'test' ? 's3.rusneb.ru' : 's3.ceph.neb.rsl'),
    accessKey: process.env.SEED_MEDIA_ACCESS_KEY || (process.env.NODE_ENV === 'test' ? 'pubmaker' : '3BWEIZ7WB2EOCE28XP42'),
    secretKey: process.env.SEED_MEDIA_SECRET_KEY || (process.env.NODE_ENV === 'test' ? 'ur9kiengath8aek8EeXohph0fakaingahVohvohl' : 'a35vnuoSAhMLozSD1YD6kGKzncKAUk47UFDuYuZC'),
   */
};
const DEFAULT_MEDIA_TYPE = 'text/text';
const MAX_URL_LENGTH = 8192;

const NPM_PACKAGE_MANIFEST_PATH = path.join(__dirname, '..', 'package.json');
const NPM_PACKAGE_MANIFEST = JSON.parse(fs.readFileSync(NPM_PACKAGE_MANIFEST_PATH, 'utf-8'));
const VERSION = NPM_PACKAGE_MANIFEST.version;
const NAME = NPM_PACKAGE_MANIFEST.name;


const ENTITY_LOCK_CODE = 138;
const RELATION_LOCK_CODE = 139;
const DEFAULT_RELATION_KIND = 'related';
const DEFAULT_ENTITY_KIND = 'entity';
const LINK_ENTITIES = ['url', 'urn', 'uri', 'link', 'href', 'identifier'];
const GROUPING_ENTITIES = ['group', 'collection', 'set', 'array', 'list', 'pack', 'bundle', 'series', 'serial', 'concept'];
const WORKER_SYNC = process.env.SEED_WORKER_SYNC || (process.env.NODE_ENV === 'test');


module.exports = {
  OPDS2_CONFIG,
  WORKER_SYNC,
  LINK_ENTITIES,
  DEFAULT_RELATION_KIND,
  ENTITY_LOCK_CODE,
  RELATION_LOCK_CODE,
  CURSOR_ENCRYPTION_SECRET,
  ORDER_DEFAULT,
  ORDER_ASC,
  ORDER_DESC,
  FLAG_TRUE,
  FLAG_FALSE,
  LOGS_DIR,
  NPM_PACKAGE_MANIFEST,
  VERSION,
  NAME,
  DEFAULT_ENTITY_KIND,
  MAX_URL_LENGTH,
  DEFAULT_DOWNLOAD_HEADERS,
  RESERVED_KINDS,
  DEFAULT_MEDIA_TYPE,
  FETCH_PARAMS,
  DEFAULT_URL_SCHEME,
  DEFAULT_SCHEMA_MEDIA_TYPE,
  MAPPING_ERROR_CTX_LINES,
  SERVICES_CONFIGS,
  MEDIA_STORAGE_CONF,
  DEFAULT_READ_STREAM_OPTIONS,
  MAX_POOL_PER_WORKER_SIZE_BYTES,

  DEFAULT_SOURCE,

  BASIC_ENTITIES,

  DEFAULT_CLUSTER_TASK_CTX,
  DEFAULT_JOBS,

  PROVIDER_TOKEN_SIZE_BYTES,
  X2J_OPTIONS,
  DEFAULT_SEARCH_SERVER_OPTIONS,
  FETCH_PROGRESS_PARAMS,
  PROVIDER_TOKEN_CYPHER,
  DEFAULT_PROVIDER,
  TYPOGRAF_OPTIONS,
  ENCRYPT_CURSORS,
  GROUPING_ENTITIES,
  PNG_MEDIA_TYPE,
  DEFAULT_SEARCH_INDEX,
  CLEANUP_SUCCESSFUL_IMPORT_FILES,
  CLEANUP_FAILED_IMPORT_FILES,
};
