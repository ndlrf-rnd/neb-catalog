const { OPDS2_MEDIA_TYPE } = require('../opds2/constants');
const { defaults } = require('../../utils');
const { x2j } = require('../../utils');
const { registerJsonata } = require('../../utils/jsonata');
const { canonicalizeXml } = require('../xml');
const { forceArray } = require('../../utils');
const {
  ATOM_ENCODING,
  ATOM_EXTENSION,
  ATOM_MEDIA_TYPE,
  ATOM_XML2JSON_OPTIONS,
  ATOM_TO_ENTITIES_JSONATA_PATH,
} = require('./constants');

const ATOM_TO_ENTITIES_JSONATA = registerJsonata(ATOM_TO_ENTITIES_JSONATA_PATH);
module.exports = {
  normalize: canonicalizeXml,
  is: input => (typeof input === 'string') && (/<feed/uig.test(input)),
  startMarker: '<entry',
  endMarker: '</entry>',
  mediaType: ATOM_MEDIA_TYPE,
  encoding: ATOM_ENCODING,
  extension: ATOM_EXTENSION,
  toEntities: (record, config) => {
    const o = defaults(config, {});
    const rec = {
      ...x2j(record, ATOM_XML2JSON_OPTIONS),
      record,
      source: o.source,
      url: o.url,
    };
    return ATOM_TO_ENTITIES_JSONATA(rec);
  },
  to: {
    [OPDS2_MEDIA_TYPE]: (record) => x2j(
      Buffer.isBuffer(record) ? record.toString(ATOM_ENCODING) : record,
      ATOM_XML2JSON_OPTIONS,
    ),
  },
  fromObjects: input => (forceArray(input).length > 1)
    ? `<feed xmlns="http://www.w3.org/2005/Atom">${input.join('\n')}</feed>`
    : input[0],
};
