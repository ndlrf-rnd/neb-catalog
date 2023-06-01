const path = require('path');
const XML_SCHEMA_ENCODING = 'utf-8';
const XML_SCHEMA_MEDIA_TYPE = 'application/xml'; // https://tools.ietf.org/html/rfc3023
const XML_SCHEMA_EXTENSION = '.xsd';

const XML_SCHEMA = {
  path: path.join(__dirname, 'XMLSchema.xsd'),
  uri: 'https://www.w3.org/2001/XMLSchema-instance',
  mediaType: XML_SCHEMA_MEDIA_TYPE,
  doc_uri: 'https://www.w3.org/2001/03/XMLSchema/TypeLibrary.xsd',
  ns: {
    // RECOMMENDED NOT  USE :xsi! 'xmlns:xsi': 'https://www.w3.org/TR/xmlschema-1/#no-xsi'
    'xmlns:xs': 'https://www.w3.org/2001/XMLSchema-instance',
    'xmlns:xhtml': 'http://www.w3.org/1999/xhtml',
  },
};
module.exports = {
  XML_SCHEMA_ENCODING,
  XML_SCHEMA_MEDIA_TYPE,
  XML_SCHEMA_EXTENSION,
  XML_SCHEMA,
};