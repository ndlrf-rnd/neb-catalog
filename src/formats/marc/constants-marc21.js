const path = require('path');
const { BASIC_ENTITIES } = require('../../constants');
const {
  ENCODING_LEVEL_INCREASE_FROM_PREPUBLISH,
  NEW,
  UNKNOWN,
  DELETED,
  CORRECTED,
  ENCODING_LEVEL_INCREASE,
} = require('./constants-record-status');
const {
  MARC_RECORD_FORMATS,
} = require('./constants-formats');

const MARC21_RECORD_TYPE_GROUP_CODES = {
  // Holdings
  // 06 - Type of record
  // u - Unknown
  // v - Multipart item holdings
  // x - Single-part item holdings  CONFLICT WITH UNIMARC
  // y - Serial item holdings       CONFLICT WITH UNIMARC
  [MARC_RECORD_FORMATS.HOLDINGS]: ['u', 'v', 'x', 'y'],
  // [MARC_BASIC_ENTITIES.ELECTRONIC]: ['m'],
  [MARC_RECORD_FORMATS.CLASSIFICATION]: ['w'],
  [MARC_RECORD_FORMATS.COMMUNITY]: ['q'],

  // 06 - Type of record
  // z - Authority data
  [MARC_RECORD_FORMATS.AUTHORITY]: ['z'],
  [MARC_RECORD_FORMATS.BIBLIOGRAPHIC]: [
    'm', // ELECTRONIC

    'a',
    'b', // b - Archival and manuscripts control [OBSOLETE, 1995]
    'c',
    'd',
    'e',
    'f',
    'g',
    'h', // h - Microform publications [OBSOLETE, 1972] [USMARC only]
    'i',
    'j',
    'k',
    'n', // n - Special instructional material [OBSOLETE, 1983]
    'o',
    'p',
    'r',
    't',
  ],
};

const MARC21_DOC_URI = 'https://www.loc.gov/marc/';
const MARC21_RELATION_RE = /^\(([^)]+)\)(.+)$/ui;
const MARC21_FIELD_RELATION_SEQ_RE = /^([^.]+)(?:[.]([^\\]+))?[\\]([acprux])$/ui;
const MARC21_REL_FIELDS = {
  765: 'translationOf',
  767: 'translation',
  770: 'supplement',
  772: 'supplementTo',
  773: 'partOf',
  774: 'hasPart',
  775: 'otherEdition',
  777: 'issuedWith',
  // ind2
  780: {
    0: 'continues',
    1: 'continuesInPart',
    2: 'precededBy',
    3: 'precededBy',
    4: 'mergerOf',
    5: 'absorbed',
    6: 'absorbed',
    7: 'separatedFrom',
    8: 'precededBy',
    9: 'precededBy',
  },
  // ind2
  785: {
    0: 'continuedBy',
    1: 'continuedInPartBy',
    2: 'succeededBy',
    3: 'succeededBy',
    4: 'absorbedBy',
    5: 'absorbedBy',
    6: 'splitInto',
    7: 'mergedToForm',
    8: 'continuedBy',
    9: 'succeededBy',
  },
  786: 'source',
  787: 'relatedTo',
};
const MARC21_SCHEMA = 'https://www.loc.gov/marc/';
const MARC21_SCHEMA_BIBLIOGRAPHIC = 'https://www.loc.gov/marc/bibliographic/';
const MARC21_SCHEMA_CLASSIFICATION = 'https://www.loc.gov/marc/classification/eccdhome.html';
const MARC21_SCHEMA_COMMUNITY = 'https://www.loc.gov/marc/community/eccihome.html';
const MARC21_SCHEMA_HOLDINGS = 'https://www.loc.gov/marc/holdings/echdhome.html';
const MARC21_SCHEMA_LANGUAGES = 'https://www.loc.gov/marc/languages/';
const MARC21_SCHEMA_COUNTRIES = 'https://www.loc.gov/marc/countries/';
const MARC21_SCHEMA_GEOAREAS = 'https://www.loc.gov/marc/geoareas/';
const MARC21_SCHEMA_ORGANIZATIONS = 'https://www.loc.gov/marc/organizations/';
const MARC21_SCHEMA_RELATORS = 'https://www.loc.gov/marc/relators/';

const MARC21_JSON_SCHEMA_PATH = path.join(__dirname, 'schemas/marc21/marc21-bibliographic-rsl-1.0.0.schema.json');
const MARC21_JSON_SCHEMA_URI = '/schemas/marc21-bibliographic-rsl-1.0.0.schema.json';

const MARC21_F008_TYPE_OF_RANGE_OFFSET = 6;
const MARC21_FIELD_STR_RE = /^([0-9]{3})(([#0-9])([#0-9]))?([$]?[0-9a-z])?$/ig;
const MARC21_RECORD_TYPE_CODES = {
  // Bibliographic
  a: {
    type: BASIC_ENTITIES.INSTANCE,
    name: 'Language material',
  },
  c: {
    type: BASIC_ENTITIES.NOTATION,
    name: 'Notated music/movement or other process',
  },
  d: {
    type: BASIC_ENTITIES.INSTANCE,
    name: 'Manuscript notated music',
  },
  e: {
    type: BASIC_ENTITIES.CARTOGRAPHIC,
    name: 'Cartographic material',
  },
  f: {
    type: BASIC_ENTITIES.CARTOGRAPHIC,
    name: 'Manuscript cartographic material',
  },
  g: {
    type: BASIC_ENTITIES.PROJECTED,
    name: 'Projected medium',
  },
  i: {
    type: BASIC_ENTITIES.AUDIO,
    name: 'Nonmusical sound recording',
  },
  j: {
    type: BASIC_ENTITIES.AUDIO,
    name: 'Musical sound recording',
  },
  k: {
    type: BASIC_ENTITIES.GRAPHIC,
    name: 'Two-dimensional non-projectable graphic',
  },
  o: {
    type: BASIC_ENTITIES.MIXED,
    name: 'Kit',
  },
  p: {
    type: BASIC_ENTITIES.MIXED,
    name: 'Mixed materials',
  },
  r: {
    type: BASIC_ENTITIES.OBJECT,
    name: 'Three-dimensional artifact or naturally occurring object',
  },
  t: {
    type: BASIC_ENTITIES.INSTANCE,
    name: 'Manuscript language material',
  },

  // file
  m: {
    type: BASIC_ENTITIES.FILE,
    name: 'Computer file',
  },

  // Classification
  w: {
    type: BASIC_ENTITIES.CLASSIFICATION,
    name: 'Classification data',
  },

  // Community
  q: {
    type: BASIC_ENTITIES.COMMUNITY,
    name: 'Community information',
  },

  // Authority
  z: {
    type: BASIC_ENTITIES.AUTHORITY,
    name: 'Authority data',
  },

  // holdings
  u: {
    type: BASIC_ENTITIES.ITEM,
    name: 'Unknown',
  },
  v: {
    type: BASIC_ENTITIES.ITEM,
    name: 'Multipart item holdings',
  },
  x: {
    type: BASIC_ENTITIES.ITEM,
    name: 'Single-part item holdings',
  },
  y: {
    type: BASIC_ENTITIES.ITEM,
    name: 'Serial item holdings',
  },
};
/*
  [MARC21](https://www.loc.gov/marc/bibliographic/bdleader.html)
    a - Increase in encoding level
    c - Corrected or revised
    d - Deleted
    n - New
    p - Increase in encoding level from prepublication
*/

const MARC21_RECORD_STATUS = {
  [ENCODING_LEVEL_INCREASE]: ENCODING_LEVEL_INCREASE,
  [CORRECTED]: CORRECTED,
  [DELETED]: DELETED,
  [UNKNOWN]: UNKNOWN,
  ' ': UNKNOWN,
  '|': UNKNOWN,
  '#': UNKNOWN,
  '$': UNKNOWN,
  '0': UNKNOWN,
  [NEW]: NEW,
  [ENCODING_LEVEL_INCREASE_FROM_PREPUBLISH]: ENCODING_LEVEL_INCREASE_FROM_PREPUBLISH,
};

const MARC21_BIBLIOGRAPHIC_LEVEL = {
  'a': {
    type: BASIC_ENTITIES.INSTANCE,
    name: 'Monographic component part',
    description: 'Monographic bibliographic unit that is physically attached to or contained in another unit such that the retrieval of the component part is dependent on the identification and location of the host item or container. Contains fields that describe the component part and data that identify the host, field 773 (Host Item Entry). Examples of monographic component parts with corresponding host items include an article in a single issue of a periodical, a chapter in a book, a band on a phonodisc, and a map on a single sheet that contains several maps.',
  },
  'b': {
    type: BASIC_ENTITIES.INSTANCE,
    name: 'Serial component part',
    description: 'Serial bibliographic unit that is physically attached to or contained in another unit such that the retrieval of the component part is dependent on the identification and location of the host item or container. Contains fields that describe the component part and data that identify the host, field 773 (Host Item Entry). Example of a serial component part with corresponding host item is a regularly appearing column or feature in a periodical.',
  },
  'c': {
    type: BASIC_ENTITIES.COLLECTION,
    name: 'Collection',
    description: 'Made-up multipart group of items that were not originally published, distributed, or produced together. The record describes units defined by common provenance or administrative convenience for which the record is intended as the most comprehensive in the system.',
  },
  'd': {
    type: BASIC_ENTITIES.COLLECTION,
    name: 'Subunit',
    description: 'Part of collection, especially an archival unit described collectively elsewhere in the system. Contains fields that describe the subunit and data that identify the host item. Subunits may be items, folders, boxes, archival series, subgroups, or subcollections.',
  },
  'i': {
    type: BASIC_ENTITIES.INSTANCE,
    name: 'Integrating resource',
    description: 'Bibliographic resource that is added to or changed by means of updates that do not remain discrete and are integrated into the whole. Examples include updating loose-leafs and updating Web sites. Integrating resources may be finite or continuing.',
  },
  'm': {
    type: BASIC_ENTITIES.INSTANCE,
    name: 'Monograph/Item',
    description: 'Item either complete in one part (e.g., a single monograph, a single map, a single manuscript, etc.) or intended to be completed, in a finite number of separate parts (e.g., a multivolume monograph, a sound recording with multiple tracks, etc.).',
  },
  's': {
    type: BASIC_ENTITIES.INSTANCE,
    name: 'Serial',
    description: 'Bibliographic item issued in successive parts bearing numerical or chronological designations and intended to be continued indefinitely. Includes periodicals; newspapers; annuals (reports, yearbooks, etc.); the journals, memoirs, proceedings, transactions, etc., of societies; and numbered monographic series, etc.',
  },

};

module.exports = {
  MARC21_DOC_URI,
  MARC21_RECORD_TYPE_GROUP_CODES,
  MARC21_FIELD_RELATION_SEQ_RE,
  MARC21_RELATION_RE,
  MARC21_REL_FIELDS,
  MARC21_SCHEMA,
  MARC21_SCHEMA_BIBLIOGRAPHIC,
  MARC21_SCHEMA_CLASSIFICATION,
  MARC21_SCHEMA_COMMUNITY,
  MARC21_SCHEMA_HOLDINGS,
  MARC21_SCHEMA_LANGUAGES,
  MARC21_SCHEMA_COUNTRIES,
  MARC21_SCHEMA_GEOAREAS,
  MARC21_SCHEMA_ORGANIZATIONS,
  MARC21_SCHEMA_RELATORS,
  MARC21_RECORD_STATUS,
  MARC21_RECORD_TYPE_CODES,
  MARC21_F008_TYPE_OF_RANGE_OFFSET,
  MARC21_FIELD_STR_RE,
  MARC21_JSON_SCHEMA_PATH,
  MARC21_JSON_SCHEMA_URI,
  MARC21_BIBLIOGRAPHIC_LEVEL,
};

