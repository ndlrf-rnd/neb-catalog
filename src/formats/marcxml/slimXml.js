const xmldom = require('xmldom');
const { MARC_BLANK_CHAR } = require('../marc/constants');

const _formatIndicator = (ind) => (ind === '_') ? MARC_BLANK_CHAR : ind;

const _mkElementValue = (name, value, doc) => {
  const el = doc.createElement(name);
  const t = doc.createTextNode(value);
  el.appendChild(t);
  return el;
};

const _mkDatafield = (field, doc) => {
  const datafield = doc.createElement('datafield');
  datafield.setAttribute('tag', field.tag);
  datafield.setAttribute('ind1', _formatIndicator(field.ind1));
  datafield.setAttribute('ind2', _formatIndicator(field.ind2));

  field.subfield.forEach(subfield => {
    const sub = _mkElementValue('subfield', subfield.value, doc);
    sub.setAttribute('code', subfield.code);

    datafield.appendChild(sub);
  });

  return datafield;
};


const _mkControlfield = (tag, value, doc) => {
  const cf = doc.createElement('controlfield');
  cf.setAttribute('tag', tag);
  const t = doc.createTextNode(value);
  cf.appendChild(t);
  return cf;
};

const _XML_SERIALIZER = new xmldom.XMLSerializer();

module.exports = {
  _XML_SERIALIZER,
  _mkControlfield,
  _mkElementValue,
  _mkDatafield,
};
