const path = require('path');

const RELAX_NG_DOC = 'https://relaxng.org/spec-20011203.html';
const RELAX_NG_ENCODING = 'utf-8';
const RELAX_NG_MEDIA_TYPE = 'application/relax-ng-compact-syntax';
const RELAX_NG_EXTENSION = '.rng';
const RELAX_NG_NS = {
  xmlns: 'http://relaxng.org/ns/structure/1.0',
  'xmlns:a': 'http://relaxng.org/ns/annotation/1.0',
};

const RELAX_NG_SCHEMA = {
  path: path.join(__dirname, 'relax-ng-schema.rng'),
  url: 'http://relaxng.org/ns/structure/1.0',
};
const HYPER_SCHEMA_PATH = path.join(__dirname, )

module.exports = {
  RELAX_NG_DOC,
  RELAX_NG_ENCODING,
  RELAX_NG_MEDIA_TYPE,
  RELAX_NG_EXTENSION,
  RELAX_NG_NS,
  RELAX_NG_SCHEMA,
  HYPER_SCHEMA_PATH,
};