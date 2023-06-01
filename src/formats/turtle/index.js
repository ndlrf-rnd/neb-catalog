const { TURTLE_FORMAT } = require('./constants');
const {
  TURTLE_EXTENSION,
  TURTLE_URL,
  TURTLE_MEDIA_TYPE,
  TURTLE_ENCODING,
} = require('./constants');
const toObjects=(record, config) => jsonld.fromRDF(record, { format: 'turtle' });
const toEntities=(record, config) => toObjects(record, config)
module.exports = {
  is: (input) => input.match(/^ *@(base|prefix)/ui),
  format: TURTLE_FORMAT,
  extension: TURTLE_EXTENSION,
  url: TURTLE_URL,
  mediaType: TURTLE_MEDIA_TYPE,
  encoding: TURTLE_ENCODING,
  toObjects,
  toEntities,
};