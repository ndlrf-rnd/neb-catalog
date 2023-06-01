const fs = require('fs');
const { hash_hex, string16_to_key } = require('siphash/lib/siphash-double');

const KEY_STRING_LENGTH = 16;
const DEFAULT_KEY = Uint32Array.from([0x00010203, 0x04050607, 0x08090a0b, 0x0c0d0e0f]);
/**
 *
 * @param message
 * @param key
 * @returns {string}
 */
const hash = (message, key = DEFAULT_KEY) => hash_hex(
  (typeof key === 'string') && (key.length === KEY_STRING_LENGTH) ? string16_to_key(key) : (key || DEFAULT_KEY),
  (typeof message === 'object') ? JSON.stringify(message) : message,
).toLocaleLowerCase();

const hmacDigest = (message, key=DEFAULT_KEY) => ([
  '',
  'SipHash128',
  toHexString(key),
  hash(message, key),
]).join('$');

const toHexString = (byteArray) => {
  return Array.from(
    byteArray,
    (byte) => ('0' + (byte & 0xFF).toString(16)).slice(-2),
  ).join('');
};

const hashFile = (filePath, key = DEFAULT_KEY) => hash(
  fs.readFileSync(filePath),
  key,
);

module.exports = {
  KEY_STRING_LENGTH,
  DEFAULT_KEY,
  hash,
  hashFile,
  toHexString,
  hmacDigest,
};
