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

export const ms2minStr = (remMs) => `${Math.floor(remMs / 60000)}:${padLeft(Math.floor(remMs / 1000 - Math.floor(remMs / 60000) * 60), 2, '0')}`;

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
const URL_RE = /([\w+]+:\/\/)?([\w\d-]+\.)*[\w-]+[.:]\w+([\/?=&#]?[\w-]+)*\/?/uig;

// const isUrl = str=>str.test(URL_RE);
export const jsonUrlsToHtml = jsonStr => jsonStr.replace(
  URL_RE,
  `"<a href='$1'>$1</a>"`,
);

/**
 *
 * @param dict
 * @returns {string}
 */
export const dictToQueryString = dict => (dict && (Object.keys(dict).length > 0))
  ? `?${
    Object.keys(dict).sort()
      .reduce((a, k) => ([...a, `${k}=${encodeURIComponent(dict[k])}`]), [])
      .join('&')
  }`
  : '';


/* eslint no-useless-escape:0 */
// export const IS_URL_RE = ;

// export const isUrl = (str) => IS_URL_RE.ma(str);
