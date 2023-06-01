const { marcObjectFromJson } = require('../marc/marcObjectToJson');
const { toEntities } = require('../marc');
const { fromSlimXml } = require('./fromSlimXml');
const { UNIMARC_JSON_SCHEMA_URI } = require('../marc/constants-unimarc');
const { RUSMARC_JSON_SCHEMA_URI } = require('../marc/constants-rusmarc');
const { forceArray, defaults, flatten } = require('../../utils');
const { marcObjectToJson } = require('../marc/marcObjectToJson');
const {
  MARCXML_UNIMARC_SCHEMA_PATH,
  MARCXML_RUSMARC_SCHEMA_PATH,
  MARCXML_MARC21_SCHEMA_PATH,
  MARCXML_ISO25577_MARC_XCHANGE_SCHEMA_PATH,
} = require('./constants');

const {
  MARC21_SCHEMA_URI,
} = require('../marc/constants-marc21');

const {
  MARC21_TO_OPDS2_JSONATA,
  RUSMARC_TO_JSONLD_BF2_JSONATA,
  RUSMARC_TO_MARC21_JSONATA,
} = require('../marc/constants');

const {
  JSONLD_MEDIA_TYPE,
} = require('../jsonld/constants');

const {
  OPDS2_MEDIA_TYPE,
} = require('../opds2/constants');

const {
  MARCXML_NS,
  MARCXML_DETECT_RE,
  MARCXML_START_MARKER,
  MARCXML_END_MARKER,
  MARCXML_EXTENSION,
  MARCXML_MARC21_SCHEMA_URI,
  MARCXML_UNIMARC_SCHEMA_URI,
  MARCXML_RUSMARC_SCHEMA_URI,
  MARCXML_ISO25577_MARC_XCHANGE_SCHEMA_URI,
  MARCXML_MEDIA_TYPE,
  MARCXML_ENCODING,
} = require('./constants');

const { detectMarcSchemaUri } = require('../marc/detect');

const marcToOpds2 = input => {
  const decodedInput = fromSlimXml(input);
  const marcObjs = forceArray(decodedInput).map(
    o => {
      const marcObj = marcObjectToJson(o)
      // fixme: fix ONIX mapping corruption in case of proper detection of schema o=>marcObj
      const marcSchemaUri = detectMarcSchemaUri(o);
      const isRusmarc = (marcSchemaUri === RUSMARC_JSON_SCHEMA_URI);
      const isUnimarc = (marcSchemaUri === UNIMARC_JSON_SCHEMA_URI);
      return (isRusmarc || isUnimarc)
        ? RUSMARC_TO_MARC21_JSONATA(marcObj)
        : marcObj;
    },
  );
  return flatten(marcObjs.map(MARC21_TO_OPDS2_JSONATA));
};

module.exports = {
  schemas: [
    {
      url: MARCXML_ISO25577_MARC_XCHANGE_SCHEMA_URI,
      path: MARCXML_ISO25577_MARC_XCHANGE_SCHEMA_PATH,
    },
    {
      url: MARCXML_MARC21_SCHEMA_URI,
      path: MARCXML_MARC21_SCHEMA_PATH,
    },
    {
      url: MARCXML_RUSMARC_SCHEMA_URI,
      path: MARCXML_RUSMARC_SCHEMA_PATH,
    },
    {
      url: MARCXML_UNIMARC_SCHEMA_URI,
      path: MARCXML_UNIMARC_SCHEMA_PATH,
    },
  ],
  extension: MARCXML_EXTENSION,
  mediaType: MARCXML_MEDIA_TYPE,
  encoding: MARCXML_ENCODING,
  startMarker: MARCXML_START_MARKER,
  endMarker: MARCXML_END_MARKER,
  ns: MARCXML_NS,
  is: (input) => {
    if (typeof input === 'string') {
      const trimmedInput = input.trim();
      if ((trimmedInput[0] === '<') && (trimmedInput[trimmedInput.length - 1] === '>')) {
        return (input.match(MARCXML_DETECT_RE));
        //return !!toSlimXml(input);
      }
    }
    return false;
  },
  // marcToOpds2,
  wrap: (input) => (forceArray(input).length > 1)
    ? `<collection>${input.join('\n')}</collection>`
    : input[0],
  // toObjects: fromSlimXml,
  // fromObjects: input => toSlimXml(input),
  toEntities: (record, config = {}) => {
    return toEntities(
      fromSlimXml(record),
      defaults(config, {
        generateCollections: false,
        mediaType: MARCXML_MEDIA_TYPE,
      }),
    ).map(
      rec => ({
        ...rec,
        record,
      }),
    );
  },
  marcToOpds2,
  to: {
    [OPDS2_MEDIA_TYPE]: marcToOpds2,
    [MARC21_SCHEMA_URI]: input => fromSlimXml(input).map(
      o => {
        const isRusmarc = (detectMarcSchemaUri(o) === RUSMARC_JSON_SCHEMA_URI);
        const isUnimarc = (detectMarcSchemaUri(o) === UNIMARC_JSON_SCHEMA_URI);
        return (isRusmarc || isUnimarc)
          ? RUSMARC_TO_MARC21_JSONATA(o.map(marcObjectToJson))
          : forceArray(o).map(marcObjectToJson);
      },
    ),
    [JSONLD_MEDIA_TYPE]: input => fromSlimXml(input).map(
      o => {
        const isRusmarc = (detectMarcSchemaUri(o) === RUSMARC_JSON_SCHEMA_URI);
        const isUnimarc = (detectMarcSchemaUri(o) === UNIMARC_JSON_SCHEMA_URI);
        return (isRusmarc || isUnimarc)
          ? RUSMARC_TO_MARC21_JSONATA(o.map(marcObjectToJson))
          : forceArray(o).map(marcObjectToJson);
      },
    ).map(RUSMARC_TO_JSONLD_BF2_JSONATA),
  },
};
