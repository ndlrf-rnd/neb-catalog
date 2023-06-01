const { FIELD_RELATION_TYPES } = require('./constants');
const { MARC21_FIELD_RELATION_SEQ_RE, MARC21_REL_FIELDS } = require('./constants-marc21');


const getMarc21Relations = o => Object.keys(MARC21_REL_FIELDS).sort().reduce(
  (a, relk) => {
    const relations = [];
    if (o.record[relk]) {
      (Array.isArray(o.record[relk]) ? o.record[relk] : [o.record[relk]]).forEach(
        relField => {
          if (relField.w) {
            relations.push({
              source_from: o.source,
              key_from: o.key,
              kind_from: o.kind,

              relation_kind: typeof MARC21_REL_FIELDS[relk] === 'string'
                ? MARC21_REL_FIELDS[relk]
                : MARC21_REL_FIELDS[relk][relField.ind2] || MARC21_REL_FIELDS[relk]['9'],

              kind_to: o.kind,
              source_to: o.source,
              key_to: relField.w,

              provider: config.provider,
            });
          }
        },
      );
    }
    return [...a, ...relations];
  },
  [],
);

const parseFieldRelationSeq = (str = '') => {
  str = (str || '').trim();
  const m = str.match(MARC21_FIELD_RELATION_SEQ_RE);
  if (m) {
    if (!FIELD_RELATION_TYPES[m[3]]) {
      throw new Error(`Invalid relationing type code: ${m[3]}`);
    }
    return [
      parseInt(m[1], 10),
      m[2] ? parseInt(m[2], 10) : null,
      FIELD_RELATION_TYPES[m[3]] ? m[3] : 'u',
    ];
  }
  return null;
};


/**
 * @example:
 * > ['LCD', '012345ZZ'] => '(LCD)012345ZZ'
 *
 * @param source
 * @param key
 * @returns {string}
 */
const makeRelationStr = (source, key) => `(${source})${key}`;


module.exports = {
  makeRelationStr,
  getMarc21Relations,
  parseFieldRelationSeq,
};
