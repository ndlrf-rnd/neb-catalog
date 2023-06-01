const xmldom = require('xmldom');
const {
  _mkControlfield,
  _mkDatafield,
  _mkElementValue,
} = require('./slimXml');

const { XML_HEADER } = require('../xml');
const XML_SERIALIZER = new xmldom.XMLSerializer();

/**
 * Convert to SLIM-XML
 * @param record
 * @param omitDeclaration
 * @returns {string}
 */
const toSlimXml = (record, { omitDeclaration = true } = {}) => {
  const doc = new xmldom.DOMImplementation({}).createDocument();
  const xmlRecord = doc.createElement('record');
  const leader = _mkElementValue('leader', record.leader, doc);

  xmlRecord.appendChild(leader);

  (record.controlfield || []).forEach(
    field => {
      xmlRecord.appendChild(
        _mkControlfield(field.tag, field.value, doc),
      );
    },
  );

  (record.datafield || []).forEach(
    field => {
      xmlRecord.appendChild(
        _mkDatafield(field, doc),
      );
    },
  );

  const xmlStr = XML_SERIALIZER.serializeToString(xmlRecord);
  return omitDeclaration
    ? xmlStr
    : [XML_HEADER, xmlStr].join('');
};
module.exports = {
  toSlimXml,
};
