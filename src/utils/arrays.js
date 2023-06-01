const fromPairs = require('lodash.frompairs');
const sortBy = require('lodash.sortby');
const range = require('lodash.range');
const sampleSize = require('lodash.samplesize');
const uniq = require('lodash.uniq');
const zip = require('lodash.zip');
const uniqBy = require('lodash.uniqby');
const differenceBy = require('lodash.differenceby');
const difference = require('lodash.difference');
const intersection = require('lodash.intersection');
const compact = require('lodash.compact');
const flattenDeep = require('lodash.flattendeep');

const flatten = (arr) => (arr.reduce((acc, out) => acc.concat(out), []));
const arrays = (x) => (Array.isArray(x) && (x.length === 1) ? x[0] : x);
/**
 *
 * @param x {any}
 * @returns Array<any>
 */
const forceArray = (x) => (Array.isArray(x) ? x : [x].filter((v) => !!v));

const counts = (arr) => {
  const res = {};
  for (let i = 0; i < arr.length; i += 1) {
    const v = arr[i];
    if (!(v in res)) {
      res[v] = 1;
    } else {
      res[v] += 1;
    }
  }
  return res;
};

module.exports = {
  counts,
  forceArray,
  unwrap: arrays,
  compact,
  intersection,
  uniq,
  uniqBy,
  differenceBy,
  difference,
  sortBy,
  fromPairs,
  zip,
  sampleSize,
  range,
  flatten: arr => flatten(forceArray(arr)),
  flattenDeep: arr => flattenDeep(forceArray(arr)),
};
