const path = require('path');
// const canonize = require('rdf-canonize');
const XmlFormat = require('../../formats/xml');
const libxslt = require('libxslt');
const libxmljs = libxslt.libxmljs;
const {
  RELAX_NG_DOC,
  RELAX_NG_ENCODING,
  RELAX_NG_MEDIA_TYPE,
  RELAX_NG_EXTENSION,
  RELAX_NG_NS,
  RELAX_NG_SCHEMA,
} = require('../constants')

module.exports = {
  ...XmlFormat,
  schema: [RELAX_NG_SCHEMA],
  extension: RELAX_NG_EXTENSION,
  mediaType: RELAX_NG_MEDIA_TYPE,
  namespace: RELAX_NG_NS,
  encoding: RELAX_NG_ENCODING,
  doc: RELAX_NG_DOC,
  // normalize: async (dataset) => canonize.canonize(dataset, { algorithm: 'URDNA2015' }),
  compile: (schema) => {
    const schemaDoc = libxmljs.parseXml(schema);
    return (inputXml) => libxmljs.parseXml(inputXml).validate(schemaDoc);
  },
};