const JsonFormat = require('../json');
const { DEFAULT_SOURCE } = require('../../constants');
const { sanitizeEntityKind } = require('../../utils');
const { isUrl } = require('../../utils');
const { flattenDeep } = require('../../utils');
const { jsonParseSafe, forceArray } = require('../../utils');
const { OPDS2_FEED_SCHEMA, CATALOG_API_JSON_HYPER_SCHEMA } = require('./constants');

const {
  OPDS2_EXTENSION,
  OPDS2_ENCODING,
  OPDS2_MEDIA_TYPE,
} = require('./constants');

const toObjects = (record) => {
  const dataStr = Buffer.isBuffer(record) ? record.toString(OPDS2_ENCODING) : record;
  return flattenDeep(forceArray(JSON.parse(dataStr)));
};

const toEntities = async (record, config) => flattenDeep(
  flattenDeep(toObjects(record, config)).map(
    v => {
      const entity = {
        key: v.metadata && v.metadata.identifier
          ? (v.metadata.identifier.match(/^\/resources\//uig)
              ? v.metadata.identifier.split(/\//ug).slice(3).join('/')
              : (isUrl(v.metadata.identifier) ? new URL(v.metadata.identifier).pathname : v.metadata.identifier)
          ) : null,
        source: v.metadata ? (isUrl(v.metadata.identifier) ? (new URL(v.metadata.identifier)).hostname : DEFAULT_SOURCE) : DEFAULT_SOURCE,
        kind: sanitizeEntityKind(v.metadata && v.metadata['@type']
          ? forceArray(v.metadata['@type'])[0].split(/\//ug).filter(v => v.trim().length > 0).slice(-1)[0]
          : 'instance'),
        record: v,
        time_source: (v.metadata ? v.metadata.modified : null) || v.modified,
        mediaType: OPDS2_MEDIA_TYPE,
      };
      return (typeof v.record === 'object')
        ? v
        : [
          entity,
          ...(v.metadata && v.metadata.issn ? [{
            kind_from: 'periodical',
            source_from: entity.source,
            key_from: v.metadata.issn,

            kind_to: entity.kind,
            source_to: entity.source,
            key_to: entity.key,

            relation_kind: 'hasPart',
            time_source: entity.time_source,
          }] : []),
        ];
    },
  ),
);


module.exports = {
  ...JsonFormat,
  extension: OPDS2_EXTENSION,
  schema: [
    OPDS2_FEED_SCHEMA,
    CATALOG_API_JSON_HYPER_SCHEMA,
  ],
  is: (input) => !!(
    (typeof input === 'object')
    && (typeof input['@context'] === 'object')
  ),
  toEntities,
  to: {
    [OPDS2_MEDIA_TYPE]: (rec) => forceArray(jsonParseSafe(rec)),
  },
  encoding: OPDS2_ENCODING,
  mediaType: OPDS2_MEDIA_TYPE,
};
