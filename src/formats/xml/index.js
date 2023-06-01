const C14n = require('xml-c14n');
const { error } = require('../../utils');
const xmldom = require('xmldom');
const { warn } = require('../../utils');
const DEFAULT_XML_C14N_ALGORITHM = 'http://www.w3.org/2001/10/xml-exc-c14n#WithComments';

const XML_MEDIA_TYPE = 'text/xml';
const XML_EXTENSION = 'xml';
const XML_ENCODING = 'UTF-8';
const XML_HEADER = `<?xml version="1.0" standalone="yes" encoding="${XML_ENCODING}" ?>\n`;

const XML_XML2JSON_OPTIONS = {
  ignoreComment: false,
  alwaysRoot: false,
  compact: false,
  alwaysChildren: false,
  alwaysArray: true,
  fullTagEmptyElement: false,
  textKey: '_text',
  attributesKey: '_attributes',
  commentKey: '_comment',
};


const canonicaliser = C14n().createCanonicaliser(DEFAULT_XML_C14N_ALGORITHM);
const xmlDomParser = new xmldom.DOMParser();


const isXml = (input) => {
  if (typeof input === 'string') {
    const trimmedInput = input.trim();
    // TODO: Less naive check
    return (trimmedInput[0] === '<') && (trimmedInput[trimmedInput.length - 1] === '>');
  }
  return false;
};


const canonicalizeXml = (xmlStr, config) => {
  // return xmlStr;
  const encoding = config.encoding || XML_ENCODING;
  xmlStr = (Buffer.isBuffer(xmlStr) ? xmlStr.toString(encoding) : xmlStr).replace(/[\r]+/ug, '');
  try {
    return (new Promise(
      (resolve, reject) => {
        const document = xmlDomParser.parseFromString(xmlStr);
        try {
          canonicaliser.canonicalise(
            document.documentElement,
            (err, res) => {
              if (err) {
                error(err);
                reject(err);
              } else {
                resolve(res);
              }
            },
          );
        } catch (e) {
          reject(e);
        }
      },
    ));
  } catch (e) {
    warn(`Error during XML canonicalization:`, e, `\n---RECORD---\n${xmlStr}\n---/RECORD---`);
    return xmlStr;
  }
};


module.exports = {
  XML_HEADER,
  XML_ENCODING,
  XML_MEDIA_TYPE,
  XML_XML2JSON_OPTIONS,
  extension: XML_EXTENSION,
  normalize: canonicalizeXml,
  mediaType: XML_MEDIA_TYPE,
  encoding: XML_ENCODING,
  is: isXml,
  from: (input, source) => ({
    source,
    record: input,
  }),
  to: { [XML_MEDIA_TYPE]: (input) => canonicalizeXml(input) },
};
