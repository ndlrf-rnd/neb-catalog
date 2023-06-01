const path = require('path');

const OPDS2_MEDIA_TYPE = 'application/opds+json';
const OPDS2_ENCODING = 'utf-8';
const OPDS2_EXTENSION = 'json';

const OPDS2_FEED_SCHEMA_PATH = path.join(__dirname, '../../schemas/drafts.opds.io/schema/feed.schema.json');
const OPDS2_FEED_SCHEMA_URL = 'https://drafts.opds.io/schema/feed.schema.json';
/* 'https://github.com/opds-community/drafts/tree/master/schema/feed.schema.json', */
const OPDS2_FEED_SCHEMA = {
  url: OPDS2_FEED_SCHEMA_URL,
  path: OPDS2_FEED_SCHEMA_PATH,
};

const CATALOG_API_JSON_HYPER_SCHEMA_PATH = path.join(__dirname, '../../schemas/hyper-schema.json');
const CATALOG_API_JSON_HYPER_SCHEMA_URL = 'https://catalog.rusneb.ru/schemas/hyper-schema.json';
const CATALOG_API_JSON_HYPER_SCHEMA = {
  url: CATALOG_API_JSON_HYPER_SCHEMA_URL,
  path: CATALOG_API_JSON_HYPER_SCHEMA_PATH,
};
const CATALOG_API_SCHEMAS_ROOT = path.join(__dirname, '../../schemas')
module.exports = {
  CATALOG_API_SCHEMAS_ROOT,
  OPDS2_FEED_SCHEMA_PATH,
  OPDS2_FEED_SCHEMA_URL,
  OPDS2_FEED_SCHEMA,
  CATALOG_API_JSON_HYPER_SCHEMA,
  CATALOG_API_JSON_HYPER_SCHEMA_PATH,
  CATALOG_API_JSON_HYPER_SCHEMA_URL,
  OPDS2_MEDIA_TYPE,
  OPDS2_EXTENSION,
  OPDS2_ENCODING,
};