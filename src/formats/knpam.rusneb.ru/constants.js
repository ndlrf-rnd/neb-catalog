const path = require('path');
const { registerJsonata } = require('../../utils');

const KNPAM_RUSNEB_RU_EXTENSION = 'json';
const KNPAM_RUSNEB_RU_ENCODING = 'utf-8';
const KNPAM_RUSNEB_RU_CREDENTIALS = {
  host: '10.250.97.74',
  path: '/db/rkp-db.sql',
  user: 'dbdownload',
  schema: 'http',
  password: 'cQmmSJ',
};

const KNPAM_RUSNEB_RU_TO_ENTITIES_JSONATA_PATH = path.join(__dirname, 'mapping/knpam.rusneb.ru-entities-2.1.0.jsonata');
const KNPAM_RUSNEB_RU_TO_ENTITIES_JSONATA = registerJsonata(KNPAM_RUSNEB_RU_TO_ENTITIES_JSONATA_PATH);
const KNPAM_RUSNEB_RU_MEDIA_TYPE = 'application/vnd.rusneb.knpam+json';

const KNPAM_MANDATORY_DUMP_FIELDS = [
  'copies',
  'parts',
  'items',
  'users',
];

const KNPAM_MANDATORY_RECORD_FIELDS = [
  'item',
  'part',
  'instance',
  'organization',
];
const KNPAM_USED_TABLES = ['copies', 'parts', 'users', 'items', 'directories']
module.exports = {
  KNPAM_USED_TABLES,
  KNPAM_RUSNEB_RU_MEDIA_TYPE,
  KNPAM_RUSNEB_RU_CREDENTIALS,
  KNPAM_RUSNEB_RU_EXTENSION,
  KNPAM_RUSNEB_RU_ENCODING,
  KNPAM_RUSNEB_RU_TO_ENTITIES_JSONATA,
  KNPAM_MANDATORY_DUMP_FIELDS,
  KNPAM_MANDATORY_RECORD_FIELDS,
};
