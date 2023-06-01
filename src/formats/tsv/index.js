const URI = require('uri-js');
const { DEFAULT_ENTITY_KIND } = require('../../constants');
const { sanitizeEntityKind } = require('../../utils');
const { isUrl } = require('../../utils');
const { DEFAULT_SOURCE } = require('../../constants');
const {
  set,
  defaults,
  flatten,
  forceArray,
  fromPairs,
  get,
  intersection,
  isEmpty,
  pathsStrings,
  pick,
  sortBy,
  warn,
  zip,
} = require('../../utils');
const { OPDS2_MEDIA_TYPE } = require('../opds2/constants');
const {
  TSV_SCHEMA_DOC,
  RELATION_FIELDS,
  TSV_ENCODING,
  TSV_MEDIA_TYPE,
  TSV_EXTENSION,
  TSV_LINE_SEPARATOR,
  TSV_CELL_SEPARATOR,
  RECORD_FIELDS,
} = require('./constants');

const TSV_DEFAULT_CONFIG = {
  lineSep: TSV_LINE_SEPARATOR,
  cellSep: TSV_CELL_SEPARATOR,
};

const NS_TO_URL = {
  'ore': 'http://www.openarchives.org/ore/terms/',
  'skos': 'http://www.w3.org/2004/02/skos/core#',
  'dc': 'http://purl.org/dc/elements/1.1/',
  'edm': 'http://www.europeana.eu/schemas/edm/',
  'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  'dcterms': 'http://purl.org/dc/terms/',
  'foaf': 'http://xmlns.com/foaf/0.1/',
  'geo': 'http://www.w3.org/2003/01/geo/wgs84_pos#',
  'bbk': 'https://lod.rsl.ru/bbkgsk/concepts#',
  'udc': 'http://udcdata.info/',
};
//https://www.w3.org/TR/uri-clarification/
const urlToKSK = (uri, defaultBaseUri) => {
  // isAbsolute()
  let urlObj = null;
  let kind = DEFAULT_ENTITY_KIND;
  let key;
  let source;
  const uriObj = URI.parse(uri);
  // if(url.match(/[))
  //{
//  scheme : "uri",
//  userinfo : "user:pass",
//  host : "example.com",
//  port : 123,
//  path : "/one/two.three",
//  query : "q1=a1&q2=a2",
//  fragment : "body"
//{
//	scheme : "urn",
//	nid : "example",
//	nss : "foo",
//}
  try {
    const pathSegs = uriObj.pathname
      .replace(/^(\/resources)?\//uig, '')
      .split('/')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    if (pathSegs.length > 1) {
      kind = sanitizeEntityKind(decodeURIComponent(pathSegs[0]));
      key = decodeURIComponent(pathSegs.slice(1).join('/'));
    }
  } catch (e) {

  }
};

const toTsv = (inputRows, config) => {
  const { lineSep, cellSep } = defaults(config || {}, TSV_DEFAULT_CONFIG);
  inputRows = forceArray(inputRows);
  const allPaths = Object.keys(
    inputRows.reduce(
      (acc, row) => Object.assign(acc, pathsStrings(row)),
      {},
    ),
  ).sort();
  const allAtomicPaths = {};
  Object.keys(allPaths).forEach(
    k => allAtomicPaths[k.replace(/[0-9]+\./uig, '')],
  );
  return [
    allPaths, // header
    ...inputRows.map(
      inputRow => allPaths.map(
        k => {
          const val = get(inputRow, k);
          if (val instanceof Date && !isNaN(val.valueOf())) {
            return val.toISOString();
          }
          return isEmpty(val) ? '' : val;
        },
      ),
    ),
  ].map(
    row => row.join(cellSep),
  ).join(lineSep);
};

const tsvProcessHeader = (headerBuffer, config) => {
  const { cellSep, lineSep, encoding } = defaults(config, TSV_DEFAULT_CONFIG);
  return headerBuffer.toString(encoding || TSV_ENCODING)
    .replace(/[\r\n]+/uig, '\n')
    .split(lineSep)[0]
    .split(cellSep)
    .map(v => v.trim());
};

const toObjects = (input, config) => {
  let inputStr = input;
  if (Buffer.isBuffer(input)) {
    const encoding = ((typeof config === 'object') ? config.encoding : null) || TSV_ENCODING;
    inputStr = input.toString(encoding);
  }
  const { lineSep, cellSep, header } = defaults(config || {}, TSV_DEFAULT_CONFIG);
  let lines = Array.isArray(inputStr)
    ? inputStr
    : inputStr.replace(/[\r\n]+/uig, '\n')
      .split(lineSep)
      .filter(v => v.trim().length > 0);

  let recordHeader = header;
  let headerLine = '';
  // Column data format require columns: kind, source, key, value and path
  // (and any path seg items with numeric component)
  let isColumnDataFormat = false;
  if (lines.length > 1) {
    headerLine = lines[0];
    recordHeader = tsvProcessHeader(headerLine, config);
    isColumnDataFormat = intersection(recordHeader, ['value', 'path']).length === 2;
    lines = lines.slice(1);
  }
  if (isColumnDataFormat) {
    const res = sortBy(
      lines.map(
        (line) => recordHeader
          ? fromPairs(zip(recordHeader, line.split(cellSep)))
          : line.split(cellSep),
      ).reduce(
        (a, o, idx) => {
          const tempKey = [
            o.kind,
            o.source,
            o.key,
          ].join('\t');
          if (isEmpty(a[tempKey])) {
            a[tempKey] = {
              ...pick(
                o,
                [
                  'kind',
                  'source',
                  'key',
                  'time_source',
                  'media_type',
                ],
              ),
              record: headerLine,
            };
          }
          return {
            ...a,
            [tempKey]: {
              ...a[tempKey],
              record: [
                a[tempKey].record,
                lines[idx],
              ].join('\n'),
            },
          };
        },
        {},
      ),
      ['kind', 'source', 'key'],
    );
    return res;
  } else {
    return lines.map(
      (line) => {
        const cells = line.split(cellSep);
        if (recordHeader) {
          return recordHeader.reduce(
            (a, k, idx) => {
              if (typeof cells[idx] !== 'undefined') {
                if (cells[idx].trim().length > 0) {
                  set(a, k, cells[idx]);
                }
              } else {
                // warn(`Can't find cell with id ${idx}, cells: ${JSON.stringify(cells)}, header: ${JSON.stringify(header)}`);
                return a;
              }
              return a;
            },
            {},
          );
        } else {
          return cells;
        }
      },
    );
  }
};


const toEntities = (rawRecord, config) => flatten(
  toObjects(rawRecord, config).map(
    (record) => {
      config = defaults(config, {});
      const time_source = record.time_source;
      /*
       record -> record: ....

       record.something      \
       record.something_more /----> { something: ..., something_more: ...}
      */

      record = {
        ...pick(record, [...RECORD_FIELDS, ...RELATION_FIELDS, 'time_source']),
        record: [
          ...(config.header ? [config.header.join(config.cellSep)] : []),
          Buffer.isBuffer(rawRecord) ? rawRecord.toString(TSV_ENCODING) : rawRecord,
        ].join(config.lineSep),
      };

      if (
        (
          record.from || record.kind_from
        ) && (
          record.to || record.kind_to
        )
      ) {
        // if (record.to) {
        //   try {
        //     new URL(record.to);
        //   }catch (e) {
        //
        //   }
        // }
        return {
          ...pick(record, RELATION_FIELDS),
          time_source,
        };
      } else if (record.kind/* || record.id*/) {
        return {
          ...defaults(
            pick(record, RECORD_FIELDS),
            { source: config.source },
          ),
          time_source,
        };
      } else {
        return {
          ...defaults(
            pick(record, RECORD_FIELDS),
            { source: config.source },
          ),
          time_source,
        };
      }
    },
  ),
);

const isTsv = (f) => (
  f
  && (typeof f.slice === 'function')
  && f.match(
    new RegExp(TSV_CELL_SEPARATOR, 'u'),
  )
);

module.exports = {
  endMarker: TSV_LINE_SEPARATOR,
  endHeaderMarker: TSV_LINE_SEPARATOR,
  mediaType: TSV_MEDIA_TYPE,
  encoding: TSV_ENCODING,
  schemaDoc: TSV_SCHEMA_DOC,
  extension: TSV_EXTENSION,
  is: isTsv,
  toEntities,
  to: {
    [OPDS2_MEDIA_TYPE]: (input, ctx) => toObjects(input, ctx).map(
      (recordObj) => ({
        ...(recordObj.record && recordObj.record.metadata ? recordObj.record : {}),
        metadata: typeof recordObj.record === 'string'
          ? { name: recordOb.record }
          : recordObj.record && recordObj.record.metadata ? recordObj.record.metadata : recordObj.record,
      }),
    ),
  },
  toObjects,
  fromObjects: (input) => toTsv(input),
  /**
   *
   * @param headerBuffer {Buffer}
   * @param config
   * @returns {Promise<string[]>}
   */
  processHeader: tsvProcessHeader,
};
