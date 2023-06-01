const fs = require('fs');
const path = require('path');


const { registerJsonata } = require('../../utils/jsonata');

const { ALEF_JSON_SCHEMA_URI, ALEF_JSON_SCHEMA_PATH, ALEF_DOC_URI } = require('./alef');
const { MARC21_JSON_SCHEMA_URI, MARC21_DOC_URI, MARC21_JSON_SCHEMA_PATH } = require('./constants-marc21');
const { UNIMARC_DOC_URI, UNIMARC_JSON_SCHEMA_URI, UNIMARC_JSON_SCHEMA_PATH } = require('./constants-unimarc');
const { RUSMARC_DOC_URI, RUSMARC_JSON_SCHEMA_URI, RUSMARC_JSON_SCHEMA_PATH } = require('./constants-rusmarc');
const { MARC_RECORD_FORMATS } = require('./constants-formats');
const { BASIC_ENTITIES } = require('../../constants');
const { JSON_SCHEMA_MEDIA_TYPE } = require('../../schemas/json-schema/constants');

const COLUMNS = [
  'record_type',
  'field',
  'occurrences',
  // 'relation_occurrences',
  'first_value_met',
  'last_value_met',
  'symbols_in_field_total',
  'description',
  'subfield_description',
];
/**
 * Marc forks
 * @type {string}
 */

// const NOTMARC_SCHEMA_URI = '';
//
// const MARC_SCHEMA_URIS = {
//   UNIMARC: UNIMARC_SCHEMA_URI,
//   RUSMARC: RUSMARC_SCHEMA_URI,
//   MARC21: MARC21_SCHEMA_URI,
//   ALEF: ALEF_SCHEMA_URI,
// };

const MARC_SCHEMAS = {
  UNIMARC: {
    uri: UNIMARC_JSON_SCHEMA_URI,
    path: UNIMARC_JSON_SCHEMA_PATH,
    doc_uri: UNIMARC_DOC_URI,
    mediaType: JSON_SCHEMA_MEDIA_TYPE,
  },
  RUSMARC: {
    uri: RUSMARC_JSON_SCHEMA_URI,
    path: RUSMARC_JSON_SCHEMA_PATH,
    doc_uri: RUSMARC_DOC_URI,
    mediaType: JSON_SCHEMA_MEDIA_TYPE,
  },
  MARC21: {
    uri: MARC21_JSON_SCHEMA_URI,
    path: MARC21_JSON_SCHEMA_PATH,
    doc_uri: MARC21_DOC_URI,
    mediaType: JSON_SCHEMA_MEDIA_TYPE,
  },
  ALEF: {
    uri: ALEF_JSON_SCHEMA_URI,
    path: ALEF_JSON_SCHEMA_PATH,
    doc_uri: ALEF_DOC_URI,
    mediaType: JSON_SCHEMA_MEDIA_TYPE,
  },
};

// noinspection NonAsciiCharacters
const INVALID_SOURCE_CODES_MAPPING = {
  'dlib.rsl.ru': 'RuMoRGB',
  'elar': 'RuMoRGB',
  'rumoelar': 'RuMoRGB',
  'rumorgb': 'RuMoRGB',

  '07nlr': 'RuSpRNB',
  'ргб': 'RuSpRNB',
  'рнб': 'RuSpRNB',
  'nlr': 'RuSpRNB',

  'ркп': 'RuMoRKP',
};


const MARC_FTC_CHAR = '\x1E';
const MARC_SD_CHAR = '\x1F';
const MARC_RECORD_SEPARATION_CHAR = '\x1D';

const MARC_LEADER_LENGTH = 24;
const MARC_DIRECTORY_INDEX_SIZE = 12;
const MARC_BLANK_CHAR = '#';

const DEFAULT_TEXT_FIELD_SEPARATOR = '\t';
const DEFAULT_TEXT_LINE_SEPARATOR = '\n';

const FIELD_RELATION_TYPES = {
  a: 'Action',
  c: 'Constituent item',
  p: 'Metadata provenance',
  r: 'Reproduction',
  u: 'General rationing', // (unspecified)
  x: 'General sequencing',
};


const RECORD_TYPE_GROUP_MANUAL_RELATIONS = {
  [MARC_RECORD_FORMATS.BIBLIOGRAPHIC]: 'http://www.loc.gov/marc/bibliographic/bd${tag}.html',
  [MARC_RECORD_FORMATS.HOLDINGS]: 'http://www.loc.gov/marc/holdings/hd${tag}.html',
  [MARC_RECORD_FORMATS.AUTHORITY]: 'http://www.loc.gov/marc/authority/ad${tag}.html',
  [MARC_RECORD_FORMATS.COMMUNITY]: 'http://www.loc.gov/marc/community/ci${tag}.html',
  [MARC_RECORD_FORMATS.CLASSIFICATION]: 'http://www.loc.gov/marc/classification/cd${tag}.html',
};


const MARC_LEADER_MARC_RECORD_STATUS_OFFSET = 5;
const MARC_LEADER_TYPE_OFFSET = 6;
const MARC_LEADER_BIBLIOGRAPHIC_LEVEL_OFFSET = 7;
const MARC_DEL_CHARACTER = '$';
const MARC_MEDIA_TYPE = 'application/marc';
const MARC_ENCODING = 'utf-8';
const MARC_EXTENSION = 'mrc';

const MARC_CONTROL_FIELD_TAGS = [
  '001',
  '002',
  '003',
  '004',
  '005',
  '006',
  '007',
  '008',
  '009',
];


// LEADER 05
const MARC_TEST_RE = /^[0-9]{5}[|#$u acdn][a-z0-9#| ]{2}/ui;


// a - Monographic component part
// b - Serial component part
// c - Collection
// d - Subunit
// i - Integrating resource
// m - Monograph/Item
// s - Serial
const RECORD_LEVELS = {
  // Item either complete in one part (e.g., a single monograph, a single map,
  // a single manuscript, etc.) or intended to be completed,
  // in a finite number of separate parts
  // (e.g., a multivolume monograph, a sound recording with multiple tracks, etc.).
  m: 'MONOGRAPH',

  // Monographic bibliographic unit that is physically attached to or contained in another unit
  // such that the retrieval of the component part is dependent on the identification and location
  // of the host item or container. Contains fields that describe the component part and data that
  // identify the host, field 773 (Host Item Entry).
  //
  // Examples of monographic component parts with corresponding host items include an article in a
  // single issue of a periodical, a chapter in a book, a band on a phonodisc, and a map on a
  // single sheet that contains several maps.
  a: 'MONOGRAPHIC_PART',

  // Made-up multipart group of items that were not originally published, distributed, or produced
  // together. The record describes units defined by common provenance or administrative
  // convenience for which the record is intended as the most comprehensive in the system.
  c: 'COLLECTION',

  // Part of collection, especially an archival unit described collectively elsewhere in the system.
  // Contains fields that describe the subunit and data that identify the host item.
  //
  // Subunits may be items, folders, boxes, archival series, subgroups, or subcollections.
  d: 'SUBUNIT',

  // Bibliographic resource that is added to or changed by means of updates that do not remain
  // discrete and are integrated into the whole.
  // Examples include updating loose-leafs and updating Web sites.
  i: 'INTEGRATING',

  // Bibliographic item issued in successive parts bearing numerical or chronological designations
  // and intended to be continued indefinitely.
  // Includes periodicals; newspapers; annuals (reports, yearbooks, etc.);
  // the journals, memoirs, proceedings, transactions, etc., of societies;
  // and numbered monographic series, etc.
  s: 'SERIAL',

  // Serial bibliographic unit that is physically attached to or contained in another unit such
  // that the retrieval of the component part is dependent on the identification and location
  // of the host item or container. Contains fields that describe the component part and data
  // that identify the host, field 773 (Host Item Entry).
  b: 'SERIAL_PART',

  // Non-formal code for unknown level
  u: 'UNKNOWN',
};
const MARC21_TO_OPDS2_JSONATA = registerJsonata(path.join(__dirname, 'mappings/marc21-to-opds2-0.7.0.jsonata'));
const RUSMARC_TO_MARC21_JSONATA = registerJsonata(path.join(__dirname, 'mappings/rusmarc-to-marc21-bibliographic-0.8.0.jsonata'));
const RUSMARC_TO_JSONLD_BF2_JSONATA = registerJsonata(path.join(__dirname, 'mappings/marc21-to-bibframe2-0.7.0.jsonata'));

// Currently unused
const BF2_LC_XSLT_PATH = path.join(__dirname, '../../contrib/marc2bibframe2/xsl/marc2bibframe2.xsl');

module.exports = {
  BF2_LC_XSLT_PATH,
  MARC21_TO_OPDS2_JSONATA,
  RUSMARC_TO_MARC21_JSONATA,
  RUSMARC_TO_JSONLD_BF2_JSONATA,
  RECORD_LEVELS,
  FIELD_RELATION_TYPES,
  INVALID_SOURCE_CODES_MAPPING,
  MARC_TEST_RE,
  MARC_ENCODING,
  MARC_CONTROL_FIELD_TAGS,
  MARC_DEL_CHARACTER,
  MARC_DIRECTORY_INDEX_SIZE,
  MARC_FTC_CHAR,
  MARC_LEADER_BIBLIOGRAPHIC_LEVEL_OFFSET,
  MARC_LEADER_LENGTH,
  MARC_LEADER_MARC_RECORD_STATUS_OFFSET,
  MARC_LEADER_TYPE_OFFSET,
  MARC_RECORD_SEPARATION_CHAR,
  MARC_RECORD_FORMATS,
  MARC_SD_CHAR,
  RECORD_TYPE_GROUP_MANUAL_RELATIONS,
  BASIC_ENTITIES,
  MARC_MEDIA_TYPE,
  MARC_EXTENSION,
  DEFAULT_TEXT_FIELD_SEPARATOR,
  DEFAULT_TEXT_LINE_SEPARATOR,
  MARC_BLANK_CHAR,
  COLUMNS,
  MARC_SCHEMAS,
};
