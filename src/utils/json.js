const jsonStringifySafe = require('json-stringify-safe');
const { isString } = require('./types');

/**
 * Idempotent catchy JSON parsing
 *
 * @param input - {string}
 * @returns {object}
 */
const jsonParseSafe = (input) => {
  if (isString(input)) {
    const trimmed = input.trim();
    const trimmedFirst = trimmed[0];
    const trimmedLast = trimmed[trimmed.length - 1];
    if (
      (
        (trimmedFirst === '[') && (trimmedLast === ']')
      ) || (
        (trimmedFirst === '{') && (trimmedLast === '}')
      ) || (
        (trimmedFirst === '"') && (trimmedLast === '"')
      )
    ) {
      try {
        return JSON.parse(input);
      } catch (e) {
        return input;
      }
    }
  }
  return input;
};


const prettyJson = val => jsonStringifySafe(val, null, 2)
  .replace(/\[ *\n */ug, '[')
  .replace(/ *\n *\]/ug, ']')
  .replace(/([^}\]]) *[,] *\n */ug, '$1, ');

module.exports = {
  prettyJson,
  jsonParseSafe,
  parse: jsonParseSafe,
  jsonStringifySafe,
  stringify: jsonStringifySafe,
};
