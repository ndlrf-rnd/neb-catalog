const path = require('path');

const ATOM_MEDIA_TYPE = 'application/atom+xml';
const ATOM_ENCODING = 'utf-8';
const ATOM_START_MARKER = '<entry';
const ATOM_END_MARKER = '</entry>';
const ATOM_NS = {
  'xmlns:atom': 'http://www.w3.org/2005/Atom',
};
const ATOM_EXTENSION = 'xml';
const OPDS_ENCODING = 'utf-8';

const ATOM_XML2JSON_OPTIONS = {
  compact: false,
  alwaysArray: true,
  alwaysChildren: false,
};

const OPDS_NS = { 'xmlns:opds': 'http://opds-spec.org/2010/catalog' };

const OPDS_SCHEMA = {
  url: 'https://github.com/opds-community/specs/blob/master/schema/1.2/opds.rnc',
  path: path.join(__dirname, 'schemas/opds-1.2.rnc'),
  encoding: OPDS_ENCODING,
};

const ATOM_SCHEMA = {
  url: 'https:/?export=raw.githubusercontent.com/ATOM-community/specs/master/schema/1.2/ATOM.rnc',
  path: path.join(__dirname, 'schemas/atom.rnc'),
  encoding: ATOM_ENCODING,
};

const ATOM_TO_ENTITIES_JSONATA_PATH = path.join(__dirname, 'mappings/atom-to-entities.jsonata');
const ATOM_FEED_RE = /(<[^> ]*:?entry[^>]*>.+<[^> ]*:?entry[^>]*>)$/uig;

module.exports = {
  OPDS_SCHEMA,
  OPDS_NS,

  ATOM_SCHEMA,
  ATOM_NS,

  ATOM_FEED_RE,

  ATOM_XML2JSON_OPTIONS,
  ATOM_TO_ENTITIES_JSONATA_PATH,
  ATOM_EXTENSION,
  ATOM_ENCODING,
  ATOM_MEDIA_TYPE,
  ATOM_START_MARKER,
  ATOM_END_MARKER,
};
