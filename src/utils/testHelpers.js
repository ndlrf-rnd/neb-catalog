const {
  isEmpty,
  isObject,
} = require('./types');
const { mapValues } = require('./objects');
const { get } = require('./../utils/objects');

const removeDates = (x /* string | Array<string> */) /* string | Array<string>*/ => (
  Array.isArray(x)
    ? x.map(removeDates)
    : ((isObject(x) ? get(x, 'message') : toString(x)) || '').replace(
    /[0-9]{2,4}\/[0-9]{2,4}\/[0-9]{2,4}/g,
    'XXXX-XX-XX',
    )
);

const cleanDatesAndUUIDs = (x /* any */) /* string | Array<string> */ => {
  if (isEmpty(x)) {
    return x;
  }
  if (x instanceof Date) {
    return 'XXXX-XX-XXTXX:XX:XX.XXXZ';
  }
  if (Array.isArray(x)) {
    return x.map(cleanDatesAndUUIDs);
  }
  if (isObject(x)) {
    return mapValues(x, cleanDatesAndUUIDs);
  }
  return toString(x)
    .replace(
      /[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z)?/g,
      'XXXX-XX-XXTXX:XX:XX.XXXZ',
    )
    .replace(
      /Quote\[[0-9]+]/g,
      'Quote[X]',
    )
    .replace(
      /Policy\[[0-9]+]/g,
      'Policy[X]',
    )
    .replace(
      /[0-9]{2,4}\/[0-9]{2,4}\/[0-9]{2,4}/g,
      'XX/XX/XX',
    )
    .replace(
      /[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}/g,
      'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    );
};

module.exports = {
  removeDates,
  cleanDatesAndUUIDs,
};
