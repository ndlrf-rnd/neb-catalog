/**
 * ONIX For Books format
 */
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');

const { error, forceArray, x2j } = require('../../utils');

const XmlFormat = require('../xml');
const { registerJsonata } = require('../../utils');
const { marcToOpds2 } = require('../marcxml');

const { OPDS2_MEDIA_TYPE } = require('../opds2/constants');
const { MARCXML_MEDIA_TYPE } = require('../marcxml/constants');

const {
  ONIX_2_1_TO_MARC21_XSLT_STYLESHEET_PATH,
  ONIX_2_1_SWITCH_TAGNAMES_XSLT_1_1_PATH,
  ONIX_INTERNATIONAL_DTD_PATH,
  ONIX_SCHEMA,
  ONIX_START_MARKER,
  ONIX_ENCODING,
  ONIX_MEDIA_TYPE,
  ONIX_EXTENSION,
} = require('./constants');

const onixWrap = (input, version = '2.1') => [
  `<ONIXMessage release="${version}" xmlns="http://www.editeur.org/onix/3.0/reference">`,
  ...forceArray(input),
].join('\n');

const ONIX_3_TO_OPDS2_JSONATA_PATH = path.join(__dirname, 'mappings/onix-3-to-opds2-0.1.0.jsonata');
const ONIX_3_TO_OPDS2_JSONATA = registerJsonata(ONIX_3_TO_OPDS2_JSONATA_PATH);

const isOnix = (input) => (
  typeof input === 'string'
) && input.match(
  /xmlns(:onix)? *= *"?https?:\/ns.editeur.org\/onix"?/uig,
);

const onix2ToMarcXml = (input) => {
  try {
    const sanitizedInput = [
      `<?xml version="1.0" encoding="utf-8"?>`,
      `<!DOCTYPE ONIXmessage SYSTEM "${ONIX_INTERNATIONAL_DTD_PATH}">\n`,
      input
        .replace(/<\?xml[^>]+\?>/uig, '')
        .replace(/<!DOCTYPE[^>]+>/uig, '')
        .replace(/^[\n\r\t ]*/uig, ''),
    ].join('\n');

    const cmd = `xsltproc '${ONIX_2_1_SWITCH_TAGNAMES_XSLT_1_1_PATH}' -`;
    const cmd2 = `xsltproc '${ONIX_2_1_TO_MARC21_XSLT_STYLESHEET_PATH}' -`;
    // const str = `<!--<collection xmlns="http://www.loc.gov/MARC21/slim">${input}</collection>-->`;
    let { stdout, stderr, code } = shelljs.echo(sanitizedInput).exec(cmd, { silent: true, }).exec(cmd2, { silent: true,});
    if (code !== 0) {
      error(`STDERR1: ${stderr}\n`);
      return null;
    }
    return stdout;
  } catch (e) {
    throw new Error(`Command "${cmd}" failed with ERROR: "${e.message}"${process.env.DEBUG ? `\n${e.stack}` : ''}`);
  }

};

const getOnixMajorVersion = input => input.indexOf('release="3.0"') === -1 ? 2 : 3;

const onix3ToOpds2 = (input, ctx) => ONIX_3_TO_OPDS2_JSONATA(
  x2j(
    input,
    {
      compact: true,
      alwaysChildren: true,
      alwaysArray: true,
    },
  ),
);

/**
 * -> 500 $a  500__ ǂa Mixed aspect ratios (1.78:1, 1.33:1)
 * -> 347 $d
 * $d - Resolution
 *
 * The clarity or fineness of detail in a digital image, expressed by the measurement of the image in pixels, etc.
 *
 * 347 ##$aimage file$2rdaft
 * 347 ##$bJPEG
 * 347 ##$d3.1 megapixels
 */
/**
 <ONIXMessage&release="3.0"
 xmlns="http://www.editeur.org/onix/3.0/reference">
 */
module.exports = {
  ...XmlFormat,
  schema: [ONIX_SCHEMA],
  startMarker: ONIX_START_MARKER,
  encoding: ONIX_ENCODING,
  mediaType: ONIX_MEDIA_TYPE,
  extension: ONIX_EXTENSION,
  is: isOnix,
  to: {
    [OPDS2_MEDIA_TYPE]: (input, ctx) => {
      input = Buffer.isBuffer(input) ? input.toString(ONIX_ENCODING) : input;
      const onixMajorVersion = getOnixMajorVersion(input);
      if (onixMajorVersion === 3) {
        return onix3ToOpds2(input, ctx);
      } else if (onixMajorVersion === 2) {
        // Use another type of converter
        const marc = onix2ToMarcXml(input);
        return marcToOpds2(marc, ctx);
      }
    },
    [MARCXML_MEDIA_TYPE]: onix2ToMarcXml,
  },
  wrap: onixWrap,
};
