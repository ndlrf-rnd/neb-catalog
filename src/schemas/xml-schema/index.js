/**
 https://www.w3.org/TR/rdf-schema/
 */
const XmlFormat = require('../../formats/xml');
const libxslt = require('libxslt');
const { XML_SCHEMA_EXTENSION } = require('./constants');
const { XML_SCHEMA_MEDIA_TYPE } = require('./constants');
const { XML_SCHEMA_ENCODING } = require('./constants');
const { XML_SCHEMA } = require('./constants');
const { XML_SCHEMA_NS } = require('./constants');
const libxmljs = libxslt.libxmljs;
const { canonicalizeXml } = require('../../formats/xml');

module.exports = {
  ...XmlFormat,
  schema: [XML_SCHEMA],
  encoding: XML_SCHEMA_ENCODING,
  mediaType: XML_SCHEMA_MEDIA_TYPE,
  extension: XML_SCHEMA_EXTENSION,
  normalize: canonicalizeXml,
  compile: (schema) => {
    const schemaDoc = libxmljs.parseXml(schema);
    return (inputXml) => libxmljs.parseXml(inputXml).validate(schemaDoc);
  },
};