const { DEFAULT_TEXT_FIELD_SEPARATOR, DEFAULT_TEXT_LINE_SEPARATOR } = require('../text/constants');
const { MARC_BLANK_CHAR } = require('../marc/constants');
const { getMarcField, isControlFieldTag } = require('../marc/fields');

/**
 * Converts field object to string representation.
 *
 * @param fieldObj {Object}
 * @returns {string} - MARC21 field string representation having one of the following formats:
 * // With subfield
 * - DDSOURCES$S
 * - DDD#S$S
 * - DDDS#$S
 * - DDD##$S
 * // No subfield
 * - DDD#S
 * - DDDS#
 * - DDD##
 */
const makeFieldStr = (fieldObj) => {
  const tag = fieldObj.tag;
  let ind1;
  let ind2;
  let subfield;
  let value;
  if (!isControlFieldTag(fieldObj.tag)) {
    ind1 = fieldObj.ind1 || MARC_BLANK_CHAR;
    ind2 = fieldObj.ind2 || MARC_BLANK_CHAR;
    subfield = (fieldObj.subfield || []).map(({ code, value }) => `\$${code} ${value}`).join('\t');
  } else {
    value = fieldObj.value;
  }
  return [tag, ind1, ind2, subfield, value].filter(v => !!v).join('');
};


/**
 * Pretty-Print fields objects list representation
 * @param input
 * @param fieldSep - fields separator
 * @param lineSep - lines separator
 * @returns {*}
 */
const marcToText = (
  input,
  fieldSep = DEFAULT_TEXT_FIELD_SEPARATOR,
  lineSep = DEFAULT_TEXT_LINE_SEPARATOR,
) => {
  const inputObj = (typeof input === 'string') ? Iso2709.from(input) : input;
  return [
    getMarcField(inputObj, 'leader'),
    ...([
      ...(inputObj.fields || []),
      ...(inputObj.controlfield || []),
      ...(inputObj.datafield || []),
    ].map(
      (fd) => (
        [
          makeFieldStr(fd),
          '',
        ].join(fieldSep)
      ),
    )),
  ].join(lineSep);
};



module.exports = {
  marcToText,
};