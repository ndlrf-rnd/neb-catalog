const path = require('path');

/**
 * ONIX <-> Marc crosswalks documentation:
 * https://www.oclc.org/content/dam/research/publications/library/2012/2012-04.pdf
 *
 * @type {string}
 */
const ONIX_MEDIA_TYPE = 'application/vnd.editeur.org+xml';
const ONIX_EXTENSION = 'onx';
const ONIX_ENCODING = 'utf-8';
const ONIX_START_MARKER = '<ONIXMessage';
const ONIX_SCHEMA = {
  path: path.join(__dirname, 'schemas/ONIX_BookProduct_3.0_reference.xsd'),
  ns: { 'xmlns': 'http://www.editeur.org/onix/3.0/reference' },
  url: 'http://www.editeur.org/onix/3.0/reference',
};

const ONIX_VERSION_2_1 = '2.1';
const ONIX_VERSION_3_0 = '3.0';

const ONIX_VERSIONS = {
  [ONIX_VERSION_2_1]: ONIX_VERSION_2_1,
  [ONIX_VERSION_3_0]: ONIX_VERSION_3_0,
};


const ONIX_2_1_SWITCH_TAGNAMES_XSLT_1_1_PATH = path.join(__dirname, 'mappings/switch-onix-tagnames-1.1.xsl');
const ONIX_2_1_SWITCH_TAGNAMES_XSLT_2_0_PATH = path.join(__dirname, 'mappings/switch-onix-tagnames-2.0.xsl');
const ONIX_2_1_TO_MARC21_XSLT_STYLESHEET_PATH = path.join(__dirname, 'mappings/ONIX2MARC21slim.xsl');
const ONIX_INTERNATIONAL_DTD_PATH = path.join(__dirname, 'mappings/onix/2.1/reference/onix-international.dtd');

//java –jar {path-to-saxon-9.x} original-onix.xml switch-onix-tagnames-2.0.xsl result-document="converted-onix.xml" dtd-path="ONIX_BookProduct_3.0_short.dtd"
module.exports = {
  ONIX_VERSION_3_0,
  ONIX_VERSION_2_1,
  ONIX_2_1_SWITCH_TAGNAMES_XSLT_1_1_PATH,
  ONIX_2_1_SWITCH_TAGNAMES_XSLT_2_0_PATH,
  ONIX_2_1_TO_MARC21_XSLT_STYLESHEET_PATH,
  ONIX_INTERNATIONAL_DTD_PATH,
  ONIX_VERSIONS,
  ONIX_MEDIA_TYPE,
  ONIX_EXTENSION,
  ONIX_ENCODING,
  ONIX_START_MARKER,
  ONIX_SCHEMA,
};