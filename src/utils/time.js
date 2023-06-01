// eslint-disable-next-line no-restricted-globals
const { removeDates } = require('./testHelpers');
const { isEmpty } = require('./types');
const { forceArray } = require('./arrays');
const isDate = require('lodash.isdate');
const { padLeft } = require('./humanize');
const isValidDate = (date) => ((date instanceof Date) && (!isNaN(date)));

const getUtcIsoString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
const getIsoTs = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).getTime();

const parseTsRange = (range) => {
  if (range) {
    return `${range}`
      .replace(/[^0-9A-Z\-:,. ]+/uig, '')
      .replace(/ /uig, 'T')
      .split(',')
      .map(d => (d ? new Date(d) : null));
  }
  return [null, null];
};

const makeTsRange = (range) => {
  if ((typeof range === 'string') && range.match(/^ *[\[(][^,]*,[^,]*[\])] *$/ui)) {
    return range.trim();
  } else {
    range = forceArray(range).concat(['', '']).slice(0, 2);
    return `'[${
      range.map(
        (v) => (
          v && isValidDate(new Date(v))
            ? (new Date(v)).toISOString().replace('T', ' ').replace(/\.[0-9]+/, '')
            : ''
        ),
      ).join(',')
    })'`;
  }
};

// const removeDates = str => str.replace(/(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/uig, '2000-01-01T02:00:00.000Z');
const ms2minStr = (remMs) => `${Math.floor(remMs / 60000)}:${padLeft(Math.floor(remMs / 1000 - Math.floor(remMs / 60000) * 60), 2, '0')}`;
const sec2minStr = (remSec) => `${Math.floor(remSec / 60)}:${padLeft(Math.floor(remSec - Math.floor(remSec / 60) * 60), 2, '0')}`;

const tsToPostgre = ts=>{
  return new Date(ts);
  // return (new Date(ts)).toISOString().replace('T', ' ').replace(/\.[0-9]+Z?$/, '')
}
const tsToPg = (ts) => {
  if (isEmpty(ts)) {
    return null;
  }
  // Fixme: unsafe for small values
  ts = parseInt(ts, 10);
  if (ts <= 2147483647) {
    ts = ts * 1000;
  }
  const tsDate = new Date(ts);
  if (tsDate) {
    return tsDate.toISOString().replace(/T/uig, ' ');
  } else {
    return null;
  }
};
module.exports = {
  sec2minStr,
  isValidDate,
  removeDates,
  makeTsRange,
  parseTsRange,
  getUtcIsoString,
  getIsoTs,
  ms2minStr,
  tsToPg,
  isDate,
  tsToPostgre,
};
