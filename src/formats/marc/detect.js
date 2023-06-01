const { JSON_MEDIA_TYPE } = require('../json/constants');
const { flattenDeep } = require('../../utils');
const { toISO2709 } = require('./iso2709');
const { MARC_MEDIA_TYPE } = require('./constants');
const { BASIC_ENTITIES } = require('../../recordTypes');
const { MARC_LEADER_BIBLIOGRAPHIC_LEVEL_OFFSET } = require('./constants');
const { flatten, forceArray, compact, zip, get, isEmpty } = require('../../utils');

const { getMarcField } = require('./fields')
;
const { MARC21_BIBLIOGRAPHIC_LEVEL } = require('./constants-marc21');
const { MARC_RECORD_FORMATS } = require('./constants-formats');
const { UNIMARC_RECORD_TYPE_GROUP_CODES } = require('./constants-unimarc');
const {
  MARC21_RECORD_TYPE_GROUP_CODES,
  MARC21_RECORD_TYPE_CODES,
} = require('./constants-marc21');
const {
  MARC_TEST_RE,
  MARC_LEADER_DESCRIPTION_LEVEL_OFFSET,
  RECORD_LEVELS,
  MARC_LEADER_MARC_RECORD_STATUS_OFFSET,
  MARC_LEADER_TYPE_OFFSET,
  MARC_SCHEMAS,
} = require('./constants');


const getRecordStatus = (rec) => get(rec, ['leader', MARC_LEADER_MARC_RECORD_STATUS_OFFSET], 'd').toLowerCase();

const getMarcSource = (pub, defaultSourceCode) => {
  if (isEmpty(pub)) {
    return '';
  }
  // noinspection NonAsciiCharacters
  let possibleSources = compact(flattenDeep([
    getMarcField(pub, '040', 'a'),
    (getMarcField(pub, '017') || []).filter(
      ({ subfield }) => (
        subfield.filter(
          ({ code, value }) => (code === 'a') && value,
        ).length > 0
      ) && (
        subfield.filter(
          ({ code, value }) => (code === 'b') && value,
        ).length > 0
      ),
    ).map(
      ({ subfield }) => subfield.filter(
        ({ code }) => (code === 'b'),
      ).map(
        ({ value }) => value,
      ),
    ).reverse(),
    getMarcField(pub, '003'),
    getMarcField(pub, '801', 'b'),
    getMarcField(pub, '035', 'a'),
    getMarcField(pub, '852', 'a'),
    defaultSourceCode,
  ])).map(v => ({
    'РГБ': 'RuMoRGB',
    'RkpciviluMoRGB': 'RuMoRGB',
    'РНБ': 'RuSpRNB',
  })[v] || v);
  const source = possibleSources[0];
  if ((!isEmpty(source)) && `${source}`.match(/^[\p{L}\p{N}\/\-\\.@_ ]+$/uig)) {
    return `${source}`;
  }
  return '';
};

const getMarcKey = rec => `${getMarcField(rec, '001') || ''}`;

/**
 * Get electronic locations
 * @param rec
 * @returns {Array<*>}
 */
const getUrlRecords = (rec) => flatten(forceArray(getMarcField(rec, '856')).map(field856 => {
  const urls = field856.subfield.filter(({ code }) => code === 'u').map(({ value }) => value);
  const types = field856.subfield.filter(({ code }) => code === 'q').map(({ value }) => value);
  return urls.map((url, idx) => {
    let key;
    let source;
    try {
      const urlObj = new URL(url);
      source = urlObj.host;
      key = urlObj.pathname;
    } catch (e) {
      const urlParts = url.split('/');
      if (url.startsWith('/')) {
        key = url;
      } else if (urlParts.length > 1) {
        source = urlParts[0];
        key = urlParts.slice(1).map(v => `/${v}`).join('');
      } else {
        key = url;
      }
    }
    const titleParts = field856.subfield.filter(({ code }) => ['3', 'x'].indexOf(code) !== -1).map(({ value }) => value);
    return ({
      title: titleParts.join(' - '),
      rel: {
        '0': 'http://opds-spec.org/acquisition',
        '1': 'alternate',
        '2': 'relatedTo',
      }[field856.ind2 || '0'] || 'relatedTo',
      kind: BASIC_ENTITIES.URL,
      source,
      key,
      type: types.length >= idx + 1 ? types[idx] : null,
    });
  });
}).filter(v => !!v));

/**
 * Get electronic locations
 * @param rec
 * @returns {Array<*>}
 */
const getPhysicalLocationRecord = (rec) => flattenDeep(['852', '853'].map(
  (fieldNumber) => forceArray(getMarcField(rec, fieldNumber)).map(
    field => {
      const fieldA = field.subfield.filter(({ code }) => code === 'a').map(({ value }) => value);
      const fieldJ = field.subfield.filter(({ code }) => code === 'j').map(({ value }) => value);
      const record = toISO2709({
        ...rec,
        datafield: [...rec.datafield, field],
      });

      return zip(fieldA, fieldJ).map(
        ([source, key]) => (
          [
            {
              source,
              key,
              record,
              kind: BASIC_ENTITIES.ITEM,
              mediaType: MARC_MEDIA_TYPE,
            },
          ]));
    },
  ),
)).filter(v => !!v);

/**
 * Detect MARC standard fork (MARC21, RUSMARC, UNIMARC e.t.c.)
 *
 * TODO: RUSMARC is UNIMARC compliant so it would be better to have of multi-level classification
 *       at the other hand [IFLA see](https://www.ifla.org/publications/unimarc-formats-and-related-documentation)
 *       them as the same level branches.
 * TODO: Differentiate other forms of UNIMARC from RUSMARC
 *
 * @param marcObj
 * @param defaultMarcSchemaUri
 * @returns {Object<{uri: string, path: string, doc_uri: string}>|null}
 */
const detectMarcSchemaUri = (
  marcObj,
  defaultMarcSchemaUri = MARC_SCHEMAS.MARC21.uri,
) => {
  if (!marcObj) {
    return null;
  }
  const field100a = forceArray(getMarcField(marcObj, '100', 'a')).join('');
  // const field801 = forceArray(getMarcField(marcObj, '801'));
  // const field200 = forceArray(getMarcField(marcObj, '200'));
  if (field100a && field100a.match(/^[0-9]{8}[a-z].{25,27}$/ui)) {
    return MARC_SCHEMAS.RUSMARC.uri;
  } else if (
    ['007', '008', '040', '852', '856'].reduce(
      (a, o) => a || (forceArray(getMarcField(marcObj, o, 'a')).length > 0),
      false,
    )
  ) {
    return MARC_SCHEMAS.MARC21.uri;
  } else if (marcObj.leader) {
    return MARC_SCHEMAS.RUSMARC.uri;
  }
  return defaultMarcSchemaUri;
};

/**
 * Detect MARC record type
 * @param rec {*}
 * @returns {string}
 */
const getMarkRecordType = (rec) => {
  const marcSchemaUri = detectMarcSchemaUri(rec);
  const leader = rec.leader;
  // TODO: Here RUSMARC and UNIMARC are about pretty the same,
  //       but i'm not confident about all RUSMARC authority and holdings files
  const codeMap = (marcSchemaUri === MARC_SCHEMAS.MARC21.uri) ? MARC21_RECORD_TYPE_GROUP_CODES : UNIMARC_RECORD_TYPE_GROUP_CODES;

  const leaderCode = ((
    Array.isArray(leader) ? leader.map((v) => v || ' ').join('') : leader
  )[MARC_LEADER_TYPE_OFFSET] || '').toLowerCase();

  return Object.keys(codeMap).filter(
    (tg) => codeMap[tg].indexOf(leaderCode) !== -1,
  )[0] || MARC_RECORD_FORMATS.UNKNOWN;
};
/**
 * Detect MARC record type
 * @param rec {*}
 * @returns {string}
 */
const getKind = (rec) => {
  // const marcSchemaUri = detectMarcSchemaUri(rec);
  // const leader = rec.leader;
  // // TODO: Here RUSMARC and UNIMARC are about pretty the same,
  // //       but i'm not confident about all RUSMARC authority and holdings files
  // const codeMap = (marcSchemaUri === MARC_SCHEMAS.MARC21.uri) ? MARC21_RECORD_TYPE_GROUP_CODES : UNIMARC_RECORD_TYPE_GROUP_CODES;
  //
  // const leaderCode = ((
  //   Array.isArray(leader) ? leader.map((v) => v || ' ').join('') : leader
  // )[MARC_LEADER_TYPE_OFFSET] || '').toLowerCase();
  //
  // const type = Object.keys(codeMap).filter(
  //   (tg) => codeMap[tg].indexOf(leaderCode) !== -1,
  // )[0] || MARC_RECORD_FORMATS.UNKNOWN;
  const marcRecordType = getMarkRecordType(rec);
  if (marcRecordType === MARC_RECORD_FORMATS.BIBLIOGRAPHIC) {
    return `${getBibliographicLevel(rec) || ''}`;
  } else {
    return `${marcRecordType || ''}`;
  }
};


/**
 * Detection
 * @returns {null|string|*}
 * @param rec
 */
const getRecordLevel = (rec) => {
  if (rec.leader) {
    /*
    WorkMusic
    substring(../marc:leader,7,1) = 'c' or
                      substring(../marc:leader,7,1) = 'd' or
                      substring(../marc:leader,7,1) = 'i' or
                      substring(../marc:leader,7,1) = 'j'"
    Contine resources
    <!-- continuing resources -->
      <xsl:when test="substring(../marc:leader,7,1) = 'a' and
                      (substring(../marc:leader,8,1) = 'b' or
                        substring(../marc:leader,8,1) = 'i' or
                        substring(../marc:leader,8,1) = 's')">
    workVisualMaterials
<xsl:when test="substring(../marc:leader,7,1) = 'g' or
                      substring(../marc:leader,7,1) = 'k' or
                      substring(../marc:leader,7,1) = 'o' or
                      substring(../marc:leader,7,1) = 'r'">
    WorkMaps
    substring(../marc:leader,7,1) = 'e' or substring(../marc:leader,7,1) = 'f'
    Electronic
    substring(../marc:leader,7,1)
    WorkBooks
    (substring(../marc:leader,7,1) = 'a' or substring(../marc:leader,7,1 = 't')
    (substring(../marc:leader,8,1) = 'a'
    or substring(../marc:leader,8,1) = 'c'
     or substring(../marc:leader,8,1) = 'd'
      or substring(../marc:leader,8,1) = 'm')
     */
    return RECORD_LEVELS[rec.leader[MARC_LEADER_DESCRIPTION_LEVEL_OFFSET]] || RECORD_LEVELS.u;
  }
  if (typeof rec === 'string') {
    return RECORD_LEVELS[rec[MARC_LEADER_DESCRIPTION_LEVEL_OFFSET]] || RECORD_LEVELS.u;
  }
  return null;
};


const isSingleRecord = (rec) => {
  return (['b', 'd', 'a', 'm'].indexOf(getRecordLevel(rec)) !== -1);
};

const isMultiRecord = (rec) => {
  return (['s', 'i', 'c'].indexOf(getRecordLevel(rec)) !== -1);
};

const getType = (rec) => (
  MARC21_RECORD_TYPE_CODES[
    (rec.leader[MARC_LEADER_TYPE_OFFSET] || '').toLowerCase()
    ] || { type: null }
).type;

const getRslCollections = (rec) => {
  const field979a = getMarcField(rec, '979', 'a');
  return (field979a || []).map(key => ({
    kind: BASIC_ENTITIES.COLLECTION,
    source: 'rumorgb',
    key,
    record: JSON.stringify({
      metadata: {
        description: 'Auto-generated collection',
        title: key,
      },
    }),
    mediaType: JSON_MEDIA_TYPE,
  }));
};

const getBibliographicLevel = (rec) => {
  return rec.leader ? (
    MARC21_BIBLIOGRAPHIC_LEVEL[
      (rec.leader[MARC_LEADER_BIBLIOGRAPHIC_LEVEL_OFFSET] || '').toLowerCase()
      ] || { type: null }
  ).type : null;
};

//
// const detectMarcItemType = (record) => {
//   // get item type
//   if (record.leader) {
//     const marcType = record.leader.substr(6, 1);
//     if (marcType === 'g') {
//       return 'film';
//     } else if (marcType === 'j' || marcType === 'i') {
//       return 'audioRecording';
//     } else if (marcType === 'e' || marcType === 'f') {
//       return 'map';
//     } else if (marcType === 'k') {
//       return 'artwork';
//     } else if (marcType === 't' || marcType === 'b') {
//       // 20091210: in unimarc, the code for manuscript is b, unused in marc.
//       return 'manuscript';
//     } else {
//       return 'book';
//     }
//   } else {
//     return 'book';
//   }
// };
const isMarc = async (input) => (typeof input === 'string') && (!!input.trim().match(MARC_TEST_RE));

module.exports = {
  isMarc,
  getRecordStatus,
  isSingleRecord,
  isMultiRecord,
  getMarcKey,
  getMarcSource,
  detectMarcSchemaUri,
  getType,
  getKind,
  getMarkRecordType,
  getRecordLevel,
  getUrlRecords,
  getPhysicalLocationRecord,
  getRslCollections,
  getBibliographicLevel,
};
