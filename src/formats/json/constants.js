const path = require('path');
const JSON_MEDIA_TYPE = 'application/json';
const JSON_ENCODING = 'utf-8';
const JSON_EXTENSION = 'json';
const JSON_SCHEMA = {
  url: 'https://json-schema.org/draft/2019-09/schema',
  path: path.join(__dirname, 'schemas/2019-09/schema.json'),
};
const JSON_HYPER_SCHEMA = {
  url: 'https://json-schema.org/draft/2019-09/hyper-schema',
  path: path.join(__dirname, 'schemas/2019-09/hyper-schema.json'),
};
const JSON_URL = 'https://www.json.org/';
module.exports = {
  JSON_URL,
  JSON_ENCODING,
  JSON_EXTENSION,
  JSON_MEDIA_TYPE,
  JSON_SCHEMA,
  JSON_HYPER_SCHEMA,
};