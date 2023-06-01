const fs = require('fs');
const { isDataFieldTag } = require('./fields');
const { MARC_BLANK_CHAR } = require('./constants');
const { isControlFieldTag } = require('./fields');
const { flatten, forceArray, get } = require('../../utils');
const { MARC21_JSON_SCHEMA_PATH } = require('./constants-marc21');
const MARC21_SCHEMA = JSON.parse(fs.readFileSync(MARC21_JSON_SCHEMA_PATH, 'utf-8'));

const marcObjectToJson = (
  rec,
  options = {
    zeroSize: false,
    allIndicators: true,
  },
) => {
  // No size is for test purposes
  const o = options || {};
  const result = rec.leader
    ? {
      leader: o.zeroSize
        ? rec.leader.replace(/^[0-9]{5}/ug, '00000')
        : rec.leader,
    }
    : {};
  const fs = [
    ...(rec.controlfield || []),
    ...(rec.datafield || []),
  ];
  fs.forEach(
    ({ tag, value, ind1, ind2, subfield }) => {
      const convertedVal = value || (forceArray(subfield).reduce(
        (acc, { code, value: subFieldValue }) => {

          const field = get(
            MARC21_SCHEMA,
            ['properties', tag],
            {},
          );

          const subfield = get(
            field,
            (field.type === 'array') ? ['items', 'properties', code] : ['properties', code],
            {},
          );
          return ({
            ...acc,
            [code]: (subfield.type === 'array')
              ? forceArray(subFieldValue)
              : Array.isArray(subFieldValue) ? subFieldValue[0] : subFieldValue,
          });
        },
        {},
      ));
      if (isControlFieldTag(tag)) {
        result[tag] = convertedVal;
      } else {
        if (o.allIndicators || (ind1 ? ind1.replace(MARC_BLANK_CHAR, '').trim() : ind1)) {
          convertedVal.ind1 = (ind1 ? ind1.trim() : MARC_BLANK_CHAR) || MARC_BLANK_CHAR;
        }

        if (o.allIndicators || (ind2 ? ind2.replace(MARC_BLANK_CHAR, '').trim() : ind2)) {
          convertedVal.ind2 = (ind2 ? ind2.trim() : MARC_BLANK_CHAR) || MARC_BLANK_CHAR;
        }
        if (MARC21_SCHEMA.properties[tag] && (MARC21_SCHEMA.properties[tag].type === 'object')) {
          result[tag] = convertedVal;
        } else if (MARC21_SCHEMA.properties[tag] && (MARC21_SCHEMA.properties[tag].type === 'string')) {
          result[tag] = convertedVal;
        } else if (MARC21_SCHEMA.properties[tag] && (MARC21_SCHEMA.properties[tag].type === 'oneOf')) {
        } else {
          result[tag] = result[tag] || [];
          result[tag].push(convertedVal);
        }
      }
    },
  );
  return result;
};

const marcObjectFromJson = (rec) => Array.isArray(rec.controlfield) ? rec : {

  leader: rec.leader,
  controlfield: flatten(Object.keys(rec).filter(k => isControlFieldTag(k)).map(k => forceArray(rec[k]).map(fieldRec => ({
    field: k,
    value: fieldRec,
  })))),
  datafield: flatten(Object.keys(rec).filter(k => isDataFieldTag(k)).map(k => forceArray(rec[k]).map(fieldRec => ({
    field: k,
    ...fieldRec,
  })))),
};

module.exports = {
  marcObjectToJson,
  marcObjectFromJson,
};
