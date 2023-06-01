const { isEmpty } = require('./types');
const prettyBytes = (num, decimals = 2) => {
  num = parseInt(num, 10);
  if (isEmpty(num)) {
    throw new TypeError('Expected a number-like');
  }

  const neg = num < 0;
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  if (neg) {
    num = -num;
  }

  if (num < 1) {
    return `${(neg ? '-' : '') + num} B`;
  }

  const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
  num = (num / (1000 ** exponent)).toFixed(decimals);
  return `${(neg ? '-' : '') + num} ${units[exponent]}`;
};


/**
 * Pad string on left side
 * @param str
 * @param len
 * @param sym
 * @returns {string}
 */
const padLeft = (str, len, sym = ' ') => [
  `${sym}`.repeat(Math.max(len - `${str}`.length, 0)),
  str,
].join('');

/**
 * Pad string on right side
 * @param str
 * @param len
 * @param sym
 * @returns {string}
 */
const padRight = (str, len, sym = ' ') => [
  str,
  `${sym}`.repeat(Math.max(len - `${str}`.length, 0)),
].join('');

/**
 *
 * @param uuidStrOrBuffer {string|Buffer}
 * @returns {string}
 */
const formatUuid = (uuidStrOrBuffer) => {
  const uuidStr = (Buffer.isBuffer(uuidStrOrBuffer)) ? uuidStrOrBuffer.toString('hex') : uuidStrOrBuffer;
  return [
    uuidStr.substr(0, 8),
    uuidStr.substr(8, 4),
    uuidStr.substr(12, 4),
    uuidStr.substr(16, 4),
    uuidStr.substr(20, 12),
  ].join('-').toLowerCase();
};
const sanitizeUuid = uuidStrOrBuffer => {
  if (uuidStrOrBuffer) {
    const uuidStr = (Buffer.isBuffer(uuidStrOrBuffer)) ? uuidStrOrBuffer.toString('hex') : uuidStrOrBuffer;
    return uuidStr.replace(/[^0-9a-f]+/uig, '').toLowerCase();
  }
  return null;
};

const BASE58_ALPHABET = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

const base58encode = (num) => {
  if (typeof num !== 'number') {
    num = parseInt(num, 10);
  }
  if ((!num) && (num !== 0)) {
    return null;
  }

  let encoded = '';
  let div = num;
  let mod;
  while (num >= 58) {
    div = num / 58;
    mod = num - (58 * Math.floor(div));
    encoded = '' + BASE58_ALPHABET.substr(mod, 1) + encoded;
    num = Math.floor(div);
  }

  return (div) ? '' + BASE58_ALPHABET.substr(div, 1) + encoded : encoded;
};

module.exports = {
  formatUuid,
  sanitizeUuid,
  base58encode,

  padRight,
  padLeft,
  prettyBytes,
};
