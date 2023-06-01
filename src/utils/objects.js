const mapValues = require('lodash.mapvalues');
const setWith = require('lodash.setwith');
const pick = require('lodash.pick');
const merge = require('lodash.merge');
const traverse = require('traverse');
const pickBy = require('lodash.pickby');
const set = require('lodash.set');
const get = require('lodash.get');
const defaults = require('lodash.defaults');
const { isEmpty } = require('./types');

const defaultTestFn = (el) => !isEmpty(el);
const removeEmpty = (el, isNotEmpty = defaultTestFn) => {
  if (Array.isArray(el)) {
    const result = el.map(
      child => removeEmpty(child, isNotEmpty),
    ).filter(child => child !== null);
    if (result.length > 0) {
      const nonTextElementsCount = result.filter(val => typeof val !== 'string').length;
      const res = (nonTextElementsCount > 0 ? result : result.join('\t'));
      return isNotEmpty(res) ? res : null;
    } else {
      return null;
    }
  } else if (isObject(el)) {
    if (typeof el._text !== 'undefined') {
      const text = el._text.join('\t');
      return (text.length > 0) ? text : null;
    } else {
      const result = pickBy(mapValues(el, (child) => removeEmpty(child, isNotEmpty)), child => child !== null);
      return (Object.keys(result).length > 0) ? result : null;
    }
  } else {
    return isNotEmpty(el) ? el : null;
  }
};


const mergeObjectsReducer = (a, o, mergeArrays = true, sumNumbers = true) => {
  o = o || {};
  Object.keys(o).sort().forEach((k) => {
    if (typeof o[k] === 'number' && sumNumbers) {
      a[k] = (a[k] || 0) + o[k];
    } else if (Array.isArray(o[k])) {
      a[k] = (a[k] || []).concat(o[k]);
    } else if (
      typeof o[k] === 'string' ||
      typeof o[k] === 'boolean' ||
      (!sumNumbers && typeof o[k] === 'number')
    ) {
      if (mergeArrays) {
        if (Array.isArray(a[k])) {
          a[k] = a[k].concat(o[k]);
        } else if (['string', 'number', 'boolean'].indexOf(a[k]) !== -1) {
          if (a[k] === o[k]) {
            return a[k];
          }
          a[k] = [a[k], o[k]];
        } else {
          a[k] = o[k];
        }
      } else {
        a[k] = o[k];
      }
    } else if (typeof o[k] === 'object') {
      a[k] = mergeObjectsReducer(a[k] || {}, o[k]);
    }
  });
  return a;
};

const pathsToStr = (paths, sep = '\n', link = ' -> ') => Object.keys(paths).sort().reduce(
  (a, source) => ([
    ...a,
    ...Object.keys(paths[source]).sort().map(
      target => paths[source][target].join(link),
    ),
  ]),
  [],
).sort().join(sep);

/**
 * Fast function for omitting object properties
 *
 * Aligned with ES6
 * Source: https://levelup.gitconnected.com/omit-is-being-removed-in-lodash-5-c1db1de61eaf
 *
 * @param originalObject
 * @param keysToOmit
 * @returns {{}}
 */
const omit = (originalObject = {}, keysToOmit = []) => {
  const clonedObject = { ...originalObject };

  for (const path of keysToOmit) {
    delete clonedObject[path];
  }

  return clonedObject;
};


// npm install traverse
const pathsStrings = (obj, collapsed = false) => {
  const p = {};
  traverse(obj).forEach(function (node) {
    if (this.isLeaf) {
      let pathStr;
      if (collapsed) {
        pathStr = this.path.map(v => v.match(/^[0-9]+$/ug) ? '*' : v).join('.');
      } else {
        pathStr = this.path.join('.');
      }
      p[pathStr] = p[pathStr] || [];
      p[pathStr].push(node);
    }
  });
  return p;
};

const omitEmpty = obj => pickBy(obj, v => (typeof v !== 'undefined') && (v !== null));


module.exports = {
  defaults,
  get,
  mapValues,
  mergeObjectsReducer,
  omit,
  omitEmpty,
  pathsStrings,
  pathsToStr,
  pick,
  pickBy,
  merge,
  removeEmpty,
  set,
  setWith,
};
