const path = require('path');
const {
  jsonStringifySafe,
  jsonParseSafe,
} = require('../../utils');
const {
  JSONLD_MEDIA_TYPE,
  JSONLD_EXTENSION,
  JSONLD_FORMAT,
  JSONLD_ENCODING,
  JSONLD_CANONIZATION_ALGORITHM,
} = require('./constants');
const JsonFormat = require('../json');
const JSONLD_SCHEMA = {
  path: path.join(__dirname, 'schemas/jsonld-schema.json'),
  url: 'https://www.w3.org/TR/json-ld11/',
};
module.exports = {
  ...JsonFormat,
  canonizationAlgorithm: JSONLD_CANONIZATION_ALGORITHM,
  format: JSONLD_FORMAT,
  schema: [JSONLD_SCHEMA],
  extension: JSONLD_EXTENSION,
  mediaType: JSONLD_MEDIA_TYPE,
  encoding: JSONLD_ENCODING,
  is: (input) => input.match(/@(context|base)/uig),
  // normalize: async doc => jsonld.canonize(doc, {
  //   algorithm: 'URDNA2015',
  //   format: 'application/n-quads',
  // }),
  toEntities: (record) => ({
    ...jsonParseSafe(record),
    record,
  }),
  toObjects: jsonParseSafe,
  fromObjects: jsonStringifySafe,
};