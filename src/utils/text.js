const capitalize = require('lodash.capitalize');
const snakeCase = require('lodash.snakecase');
const camelCase = require('lodash.camelcase');
const { encodeUrlComponentRfc3986 } = require('./url');
const pluralize = require('pluralize');

// Returns the length of the input string in UTF8 bytes
const lengthInBytes = (str) => {
  const match = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (match ? match.length : 0);
};

const sanitizeEntityKind = (inputKind) => {
  const kind = snakeCase(`${(
    (inputKind || '').split(/[#:]/u).filter(v=>!!v).slice(-1)[0]
  )}`)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9_]+/uig, '_')
    .replace(/(^_+|_+$)/ug, '');
  if (kind.length === 0) {
    return null;
  } else {
    return kind;
  }
};

const escapeUnprintable = str => str
  .replace(/\n/ug, '\\n')
  .replace(/\r/ug, '\\r')
  .replace(/\t/ug, '\\t');


const tokenize = value => value
  .replace(/<[a-z\/][^>]*>/uig, '') // Remove html tags
  .replace(/[^\p{L}\p{N}\-_.!?,"';]+/uig, ' ') // Remove chars not common fortexts
  // .replace(/[:]+/uig, '&colon;') // Remove chars not common fortexts
  .replace(/([\-_.!?,"';])/ug, ' $1 ') // Remove chars not common fortexts
  .replace(/[ ]{2}/ug, ' ')
  .trim();


const sanitizeKey = key => {
  if (key.startsWith('/')) {
    let keyParts = key
      .split('/')
      .filter((seg) => (!!seg))
      .map(v => decodeURIComponent(v.trim()).toLocaleLowerCase());

    if (keyParts[0] !== 'resources') {
      keyParts = ['resources', ...keyParts];
    }
    return [
      keyParts[0],  // resources
      keyParts[1],  // kind
      keyParts[2],  // source
      keyParts.slice(3).join('/'),
    ].map(
      v => `/${encodeUrlComponentRfc3986(v)}`,
    ).join('');
  } else {
    return key;
  }
};

module.exports = {
  sanitizeKey,
  tokenize,
  escapeUnprintable,
  lengthInBytes,
  pluralize,
  camelCase,
  capitalize,
  sanitizeEntityKind,
};
