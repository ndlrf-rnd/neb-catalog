export const getJsonFromUrl = (url = location.search) => {
  const query = url.substr(1);
  const result = {};
  query.split('&').forEach(function (part) {
    const item = part.split('=');
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
};

export const prettyBytes = (num, decimals = 2) => {
  num = parseInt(num, 10);
  if (typeof num !== 'number') {
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

export const padLeft = (str, len, sym = ' ') => [
  `${sym}`.repeat(Math.max(len - `${str}`.length, 0)),
  str,
].join('');
const ms2minStr = (remMs) => `${Math.floor(remMs / 60000)}:${padLeft(Math.floor(remMs / 1000 - Math.floor(remMs / 60000) * 60), 2, '0')}`;

export const parseTsRange = (range) => {
  if (range) {
    return `${range}`
      .replace(/[^0-9A-Z\-:,. ]+/uig, '')
      .replace(/ /uig, 'T')
      .split(',')
      .map(d => (d ? new Date(d) : null));
  }
  return [null, null];
};

const BASE58_ALPHABET = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

export const base58encode = (num) => {
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