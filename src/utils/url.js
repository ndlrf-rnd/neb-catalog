const UrlLib = require('url');
const { forceArray, flattenDeep } = require('./arrays');
const { isEmpty } = require('./types');
const {
  MAX_URL_LENGTH,
  DEFAULT_URL_SCHEME
} = require('../constants');


/* eslint no-useless-escape:0 */


const normalizeUrl = (url) => UrlLib.parse(url).format();

/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent
 * @param p
 * @returns {string}
 */
const decodeQueryParam = (p) => decodeURIComponent(`${p}`.replace(/\+/ug, ' '));

const removeUriSchemaAndClean = (u) => u
  .replace(/^([a-z0-9-_]+:\/)?\//uig, '')
  .replace(/\/\//ug, '/');

const isAbsolute = (uri) => (typeof uri === 'string') && (
  !/^[a-z]:\\/ui.test(uri)
) && (
  /^[a-z][a-z\d+\-.]*:/ui.test(uri)
);


const isRelative = (uri) => (typeof uri === 'string') && (!isAbsolute(uri));
const isLocal = (uri) => (typeof uri === 'string') && uri.startsWith('#');
const isEpubCfi = (uri) => (typeof uri === 'string') && uri.match(/#epubcfi/ui);
const isDataUri = (uri) => (typeof uri === 'string') && RE_DATA_URI.test(uri);

const isEmptyUri = (uri) => ((typeof uri === 'string') ? (uri.replace(/[# \n]+/ug, '').length === 0) : true);

const contentTypeFromDataUri = (uri) => ((typeof uri === 'string') ? uri.replace(RE_DATA_URI, '$1') : null);

const getUriReplacementFn = (basePath, serialPageId, resourceReplacementsDict) => (uri) => {
  if (isEmptyUri(uri)) {
    return null;
  }
  if (isDataUri(uri)) {
    return uri;
  }
  if (isAbsolute(uri)) {
    return uri;
  }

  const baseDir = path.dirname(basePath);
  const fullPath = path.join(baseDir, uri);
  const replacementFromDict = resourceReplacementsDict[fullPath];
  if (replacementFromDict) {
    error(`Replacing resource uri [${baseDir}] ${uri} -> ${replacementFromDict}`);
    return replacementFromDict;
  }
  const uriObj = url.parse(fullPath);
  const pagePrefix = uriObj.path.split('/').slice(-1)[0].split('.')[0].toLowerCase();
  const hashSuffix = uriObj.hash ? `-${uriObj.hash.substring(1)}` : '';
  const newUri = `#id-${pagePrefix}${hashSuffix}`;
  error(`Replacing location uri[${basePath}:${serialPageId}] ${uri} -> ${newUri}`);
  return newUri;
};

const isLocalHost = (hostname) => [
  'localhost',
  '127.0.0.1',
  '192.168.0.1',
  '10.0.0.1',
  '',
].indexOf(hostname || '') !== -1;

const encodeUrlComponentRfc3986 = (str) => typeof str === 'string' ? encodeURIComponent(str).replace(
  /[!'()*]/ug,
  (c) => '%' + c.charCodeAt(0).toString(16),
) : null;

const replaceUriParam = (url, name, value) => {
  url = new URL(`${url}`);
  if (isEmpty(value)) {
    url.searchParams.delete(name);
  } else {
    url.searchParams.set(name, value);
  }
  return url;
};

const isUrl = val => ((typeof val === 'string')
  && (val.length < MAX_URL_LENGTH)
  && (!!val.match(/^https?:/)));
const trimSlashes = v => (typeof v === 'string') ? v.replace(/(^\/+|\/+$)/uig, '') : v;

const normalizeUrlScheme = (
  urlStr,
  normalSchema = DEFAULT_URL_SCHEME,
) => `${urlStr || ''}`.replace(
  /^([^\/.#?&]*:\/\/)?/ui,
  `${(`${urlStr || ''}`.match(/^([^\/.#?&]*):\/\//) || [null, normalSchema])[1]}://`,
);


const joinUriParts = (...up) => encodeURI(
  flattenDeep(forceArray(up))
    .map(trimSlashes)
    .filter(v => !!v)
    .join('/'),
);

module.exports = {
  trimSlashes,
  replaceUriParam,
  isUrl,
  isDataUri,
  isLocalHost,
  isLocal,
  isEpubCfi,
  contentTypeFromDataUri,
  isRelative,
  getUriReplacementFn,
  isAbsolute,
  normalizeUrl,
  decodeQueryParam,
  normalizeUrlScheme,
  joinUriParts,
  encodeUrlComponentRfc3986,
  removeUriSchemaAndClean,
  MAX_URL_LENGTH,
};
