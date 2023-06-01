const {
  jsonStringifySafe,
  jsonParseSafe,
} = require('../../utils');
const {
  JSON_SCHEMA_EXTENSION,
  JSON_SCHEMA_MEDIA_TYPE,
} = require('./constants');
const JsonFormat= require('../../formats/json')

const Ajv = require('ajv');


module.exports = {
  ...JsonFormat,
  extension: JSON_SCHEMA_EXTENSION,
  mediaType: JSON_SCHEMA_MEDIA_TYPE,
  // record.url = parsedRecord.$id || parsedRecord.url;
  normalize: (record) => jsonParseSafe(jsonStringifySafe(record)),
  compile: (record) => {
    const AJV = new Ajv();
    AJV.compile(typeof record === 'string' ? jsonParseSafe(record) : record)
  },
};