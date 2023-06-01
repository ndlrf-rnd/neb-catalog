const { compact, forceArray } = require('../../utils/arrays');
const { MARC21_RELATION_RE } = require('./constants-marc21');
const {
  INVALID_SOURCE_CODES_MAPPING,
  MARC_BLANK_CHAR,
} = require('./constants');

const normalizeSourceCode = (sc) => {
  if (typeof sc !== 'string') {
    return null;
  }
  const mapped = INVALID_SOURCE_CODES_MAPPING[sc.toLocaleLowerCase()];
  if (typeof mapped !== 'undefined') {
    return mapped;
  }
  return sc;
};

const parseIdentifier = (str = '', source = null, isRelation = true) => {
  str = (str || '').trim();
  let res = null;
  if (!str) {
    return res;
  }

  // Test for Marc
  const resParts = str.match(MARC21_RELATION_RE);
  if (resParts) {

    if ((source || '').trim()) {
      res = [source, resParts ? resParts[2] : str];
    } else if (resParts) {
      res = resParts.slice(1, 3).map(
        (v) => v.replace(new RegExp(MARC_BLANK_CHAR, 'ug'), ' ').trim(),
      );
    }
    // Clean out data source excessive definitions
    if (res && res[1].match(MARC21_RELATION_RE)) {
      res[1] = res[1].replace(/^(\([^)]*\)[\p{Z}]+)+/igu, '').trim();
    }
    if (compact(forceArray(res)).length < 2) {
      return res;
    } else {
      return res ? {
        [isRelation ? 'key_to' : 'key']: res[1],
        [isRelation ? 'source_to' : 'source']: normalizeSourceCode(res[0]),
      } : {
        [isRelation ? 'source_to' : 'source']: normalizeSourceCode(str),
      };
    }
  } else {
    // Test on URI-like
    const entChunks = str.replace(/^[a-z0-9_-]*:\/\//ui, '').split('/').filter(
      (x) => !!x,
    );
    if (entChunks.filter(v => !!v).length > 1) {
      return {
        [isRelation ? 'source_to' : 'source']: entChunks[0],
        [isRelation ? 'key_to' : 'key']: entChunks.slice(1).join('/'),
      };
    } else {
      return res;
    }
  }
};

module.exports = {
  parseIdentifier,
  normalizeSourceCode,
};