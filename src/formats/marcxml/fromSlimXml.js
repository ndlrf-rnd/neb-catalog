const path = require('path');
const { x2j } = require('../../utils');
const { registerJsonata } = require('../../utils/jsonata');
const { marcObjectFromJson } = require('../marc/marcObjectToJson');
const { MARCXML_ENCODING } = require('./constants');
const { XML_HEADER } = require('../xml');
const {
  _mkControlfield,
  _mkDatafield,
  _mkElementValue,
  _XML_SERIALIZER,
} = require('./slimXml');

/**
 * Convert to SLIM-XML
 * @param record
 * @param omitDeclaration
 * @returns {string}
 */
const toSlimXml = (record, { omitDeclaration = true } = {}) => {
  record = marcObjectFromJson(record);
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

  const xmlStr = _XML_SERIALIZER.serializeToString(xmlRecord);
  return omitDeclaration
    ? xmlStr
    : [XML_HEADER, xmlStr].join('');
};
const MARCXML_TO_OBJ_JSONATA = registerJsonata(
  path.join(__dirname, 'mappings/marcxml-to-obj-0.1.0.jsonata'),
);
const fromSlimXml = (xmlStr, config) => {
  const input = Buffer.isBuffer(xmlStr) ? xmlStr.toString(MARCXML_ENCODING) : xmlStr;
  const obj = x2j(
    input,
    {
      compact: false,
      // alwaysChildren: true,
      alwaysArray: true,
      // trim: false,
      // sanitize: false,
      addParent: false,
    },
  );
  return MARCXML_TO_OBJ_JSONATA(obj);
};
module.exports = {
  MARCXML_TO_OBJ_JSONATA,
  fromSlimXml,
  toSlimXml,
};
