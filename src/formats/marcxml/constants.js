const path = require('path');

const MARCXML_MEDIA_TYPE = 'application/marcxml+xml';
const MARCXML_ENCODING = 'utf-8';
const MARCXML_EXTENSION = 'mrx';

/**
 * Schemas
 * @type {string}
 */

/*
MARC21
 */
const MARCXML_MARC21_SCHEMA = {
  url: 'https://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd',
  path: path.join(__dirname, '../schemas/MARC21slim.xsd'),
  ns: {
    xmlns: 'http://www.loc.gov/MARC21/slim',
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'xsi:schemaLocation': 'http://www.loc.gov/MARC21/slim\nhttp://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd',
  },

};

/*
UNIMARCSLIM: UNIMARC XML Schema prepared by Giovanni Bergamin and Detlev Schumacher based on MARCXML
(The MARC 21 XML Schema prepared by Corey Keith http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd).
This schema accommodates UNIMARC bibliographic and authority records and allows the embedded fields technique August 8, 2004 Initial Release 0.1 Janyary 21, 2008 fixed record label regexp pattern value last for chars /450./ instead of /450 | /)
 */
const MARCXML_UNIMARC_SCHEMA = {
  url: 'https://www.bncf.firenze.sbn.it/progetti/unimarc/slim/documentation/unimarcslim.xsd',
  path: path.join(__dirname, '../schemas/unimarcslim.xsd'),
};

/*
RUSMARC

UNISlim: UNIMARC XML Schema prepared by National Library of Russia and National Library of Florence based on MarcXchange (ISO 25577) - the general XML schema for MARC formatted records.		</xsd:documentation>
		This schema allows XML markup of UNIMARC records as specified in the UNIMARC documentation (see http://www.ifla.org/VI/3/p1996-1/sec-uni.htm). This schema accommodates UNIMARC records and allows the embedded fields technique. Implementation of the embedded fields technique in the Schema follows UNIMARCSLIM Schema prepared by Giovanni Bergamin and Detlev Schumacher (http://www.bncf.firenze.sbn.it/unimarc/slim/documentation/unimarcslim.xsd)
*/
const MARCXML_RUSMARC_SCHEMA = {
  url: 'http://rusmarc.ru/shema/UNISlim.xsd',
  path: path.join(__dirname, '../schemas/UNISlim.xsd'),
};
/*
MarcXchange: The general XML schema for MARC formatted records. Prepared by Tommy Schomacker - version 1.1 - July 2007.
MarcXchange is made as a generalization (mainly by weakening restrictions) of the MARCXML schema for MARC21.
MARCXML is made by Corey Keith from the Library of Congress. </xsd:documentation>
<xsd:documentation> The schema supports XML markup of MARC records as specified in ISO 2701. ISO 2709 defines the following general structure: Record Label - Directory - Record Identifier - Reference Fields - Data Fields. In the schema the element "leader" is used for ISO 2709 Record Label, the element "control field" for ISO 2709 Record Identifier and Reference Fields, and the element "data field" for ISO 2709 Data Fields. The schema has no counterpart to ISO 2709 Directory. </xsd:documentation>
<xsd:documentation> Extensions and elucidations: The schema allows the usage of "data fields" for all legal tags, including 001 to 009, 00A to 00Z and 00a to 00z. Subfield identifiers may consist of 8 bits characters from ISO 10646 BMP row 00 (Basic Latin and Latin-1 Supplement). Two attributes are introduced to specify the content of a record - "format" to specify the MARC format, "type" to specify the kind of record.
 */
const MARCXML_ISO25577_MARC_XCHANGE_SCHEMA = {
  url: 'https://www.loc.gov/standards/iso25577/marcxchange-1-1.xsd',
  path: path.join(__dirname, '../schemas/marcxchange-1-1.xsd'),
};

/**
 * Detection
 * @type {RegExp}
 */
const MARCXML_DETECT_RE = /<([^> ]+:)?record[^<>]+>[^<]*<([^> ]+:)?leader[^>]+>/uig;
const MARCXML_START_MARKER = '<record';
const MARCXML_END_MARKER = '</record>';
const MARCXML_COLLECTION_RE = /(<collection[^>]*>|<[^> ]+:collection[^>]*>)?(.+)(<\/collection[^>]*>|<\/[^> ]+:collection[^>]*>)?/uig;


module.exports = {
  MARCXML_MEDIA_TYPE,
  MARCXML_ENCODING,
  MARCXML_DETECT_RE,
  MARCXML_EXTENSION,

  MARCXML_MARC21_SCHEMA,
  MARCXML_UNIMARC_SCHEMA,
  MARCXML_RUSMARC_SCHEMA,
  MARCXML_ISO25577_MARC_XCHANGE_SCHEMA,

  MARCXML_START_MARKER,
  MARCXML_END_MARKER,
  MARCXML_COLLECTION_RE,

  // MARC21_SLIM_SCHEMA,
  // BIBFRAME_RDF_SCHEMA,
  // BFLC_RDF_SCHEMA,
};
