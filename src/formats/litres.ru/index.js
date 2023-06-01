const XmlFormat = require('../xml');
const { flattenDeep } = require('../../utils');
const { x2j, forceArray, flatten } = require('../../utils');
const { registerJsonata } = require('../../utils/jsonata');
const { XML_MEDIA_TYPE } = require('../xml');
const {
  LITRES_RU_SCHEMA,
  LITRES_TO_ENTITY_JSONATA_PATH,
  LITRES_TO_OPDS2_JSONATA_PATH,
  LITRES_RU_XML_ENCODING,
  LITRES_RU_XML_MEDIA_TYPE,
  LITRES_RU_XML2JSON_OPTIONS,
} = require('./constants');
const { OPDS2_MEDIA_TYPE } = require('../opds2/constants');
const LITRES_TO_OPDS2_JSONATA = registerJsonata(LITRES_TO_OPDS2_JSONATA_PATH);
const LITRES_TO_ENTITY_JSONATA = registerJsonata(LITRES_TO_ENTITY_JSONATA_PATH);
const toObjects = input => (typeof input === 'object') && (!Buffer.isBuffer(input))
  ? input
  : x2j(
    (Buffer.isBuffer(input) ? input.toString(LITRES_RU_XML_ENCODING) : input).replace(/\r\n/ug, '\n'),//.replace(/<text>[^<]*<\/text>/uig, '<text>SURROGATE_ID</text>'),
    LITRES_RU_XML2JSON_OPTIONS,
  );
// FIXME: https://storage.rusneb.ru/source/litres.ru/litres-4_2003-01-01_2020-07-17.xml.gz
module.exports = {
  ...XmlFormat,
  is: input => (typeof input === 'string') && (/<fb-updates/uig.test(input)),
  schema: [LITRES_RU_SCHEMA],
  startMarker: '<updated-book',
  endMarker: '</updated-book>',
  mediaType: LITRES_RU_XML_MEDIA_TYPE,
  encoding: LITRES_RU_XML_ENCODING,
  toObjects,
  toEntities: (record, config) => {
    record = Buffer.isBuffer(record) ? record.toString(LITRES_RU_XML_ENCODING) : record;
    /*
    const records = jsonataRunner(`
  $.elements.elements[($.name = 'updated-book') or ($.name = 'removed-book')].{
    'id': $.attributes.id,
    'uid': [$.attributes.uid, $.attributes.external_id, $.attributes.uuid].$,
    'updated': $toMillis($replace($.attributes.updated, ' ', 'T')),
    'removed': $toMillis($replace($.attributes.removed, ' ', 'T')),
    'record': $
  }
  `)(
    x2j(fs.readFileSync(path.join(__dirname, 'audio-fresh.xml')), {
      compact: false,
      alwaysArray: true,
    }),
  ).map(
    ({record}) => {
      const recJson = {
        declaration: {
          attributes: {
            version: '1.0',
            encoding: 'UTF-8',
          },
        },
        elements: forceArray(record),
      };
      return j2x(recJson);
    },
  );
    const id = record.match(/<(?!updated|removed)-book[^>]* id="?([^ "]+)"? /);
    const uid = record.match(/<(?!updated|removed)-book[^>]* id="?([^ "]+)"? /);
    const updated = record.match(/<updated-book[^>]* updated="([^ "]+)"? /);
    const removed = record.match(/<removed-book[^>]* removed="([^ "]+)"? /);
     */
    return flattenDeep(forceArray(
      LITRES_TO_ENTITY_JSONATA({
        ...toObjects(record, config),
        record,
      }, config),
    ).map(
      subRecordObj => ({
        ...subRecordObj,
        record,
      }),
    ));
  },
  to: {
    [XML_MEDIA_TYPE]: value => value,
    [OPDS2_MEDIA_TYPE]: recordRaw => {
      const record = x2j(
        Buffer.isBuffer(recordRaw) ? recordRaw.toString(LITRES_RU_XML_ENCODING) : recordRaw,
        LITRES_RU_XML2JSON_OPTIONS,
      );
      return flattenDeep(LITRES_TO_OPDS2_JSONATA(record['fb-updates'] || record));
    },
  },
};
