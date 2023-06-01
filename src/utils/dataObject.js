const { mapValues } = require('./objects');
const { isEmpty } = require('./types');
const { jsonParseSafe } = require('./json');
const { pickBy } = require('./objects');
const {
  isArray,
  isDate,
  isObject,
  isString,
} = require('./types');


const EMPTY_STRING_VALUES = ['', '[]', '{}', '0000-00-00'];

const DEFAULT_VALUE_FILTER_FN = (v) => (
  !isEmpty(v)
) && (
  EMPTY_STRING_VALUES.indexOf(v) === -1
) && (
  (!isArray(v)) || (v.length > 0)
);

/**
 * Sanitize Object
 * @type {any}
 */
const DEFAULT_KEY_FILTER_FN = (k) => !(
  isString(k) ? !(k.match(/^(person_|password$|password_|passport_)/ui)) : !isEmpty(k)
);


const sanitizeDataObject = (
  v,
  keyFilterFn = DEFAULT_KEY_FILTER_FN,
  valueFilterFn = DEFAULT_VALUE_FILTER_FN,
) => {
  if (isString(v) && v.match(/^[ \t\r\n]*[{\[][ \t\r\n]*"/uig)) {
    v = jsonParseSafe(v.replace(/\\\\"/ug, '"').replace(/\r\n/ug, '\n'));
  }
  if (isArray(v)) {
    return v.map(
      vx => sanitizeDataObject(vx, keyFilterFn, valueFilterFn),
    ).filter(valueFilterFn);
  } else if (isDate(v)) {
    return v.toISOString();
  } else if (isObject(v)) {
    return pickBy(
      mapValues(
        v,
        (val) => sanitizeDataObject(val, keyFilterFn, valueFilterFn),
      ),
      valueFilterFn,
    );
  }
  return v;
};


module.exports = {
  sanitizeDataObject,
};
