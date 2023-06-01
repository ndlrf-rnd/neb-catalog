const TSV_MEDIA_TYPE = 'text/tab-separated-values';
const TSV_ENCODING = 'utf-8';
const TSV_LINE_SEPARATOR = '\n';
const TSV_CELL_SEPARATOR  = '\t';
const MAX_DETECTION_HEAD_SIZE = 4096;
const TSV_EXTENSION = 'tsv';
const TSV_DEFAULT_HAVE_HEADER = true;
const TSV_SCHEMA_DOC = 'https://digital-preservation.github.io/csv-schema/csv-schema-1.2.html'

const RECORD_FIELDS =[
  'kind',
  'source',
  'key',
  'record',
];

const RELATION_FIELDS =[
  'kind_from',
  'source_from',
  'key_from',

  'relation_kind',

  'kind_to',
  'source_to',
  'key_to',
];


// const CSV_EXPORT_QUOTE = '\x01';
// const CSV_EXPORT_DEL = '\x02';
// const CSV_EXPORT_NEWLINE = `\n`;

module.exports = {
  RECORD_FIELDS,
  RELATION_FIELDS,
  TSV_ENCODING,
  TSV_EXTENSION,
  TSV_MEDIA_TYPE,
  TSV_LINE_SEPARATOR,
  TSV_CELL_SEPARATOR,
  TSV_SCHEMA_DOC,
  TSV_DEFAULT_HAVE_HEADER,
  MAX_DETECTION_HEAD_SIZE,
};