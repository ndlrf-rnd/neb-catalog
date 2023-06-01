const { OPDS2_MEDIA_TYPE } = require('../opds2/constants');
const { JSON_HYPER_SCHEMA } = require('./constants');
const {
  jsonStringifySafe,
  jsonParseSafe,
} = require('../../utils');

const {
  JSON_EXTENSION,
  JSON_ENCODING,
  JSON_MEDIA_TYPE,
  JSON_URL,
  JSON_SCHEMA,
} = require('./constants');

const isJson = (input) => {
  if ((typeof input === 'string') && input.match(/^ *[\[{"].*[\]}"]/uig)) {
    try {
      return jsonParseSafe(input);
    } catch (e) {
      return false;
    }
  }
  return false;
};


module.exports = {
  schema: [
    JSON_SCHEMA,
    JSON_HYPER_SCHEMA,
  ],
  url: JSON_URL,
  mediaType: JSON_MEDIA_TYPE,
  encoding: JSON_ENCODING,
  extension: JSON_EXTENSION,
  normalize: (input) => jsonStringifySafe(jsonParseSafe(input)).replace(/[\r\n]/uig, '\n').trim(),
  is: isJson,
  toObjects: jsonParseSafe,
  to: {
    [JSON_MEDIA_TYPE]: jsonParseSafe,
    [OPDS2_MEDIA_TYPE]: rec => {
      return { metadata: jsonParseSafe(rec) };
    },
  },
  fromObjects: jsonStringifySafe,
};
