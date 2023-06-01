const path = require('path');

const {
  NEW,
  UNKNOWN,
  DELETED,
  CORRECTED,
} = require('./constants-record-status');
/*
  [RUSMARC](http://rusmarc.ru/rusmarc/fields.htm#marker)
  Статус записи (позиция символа 5)
    n = новая запись
    d = исключенная запись
    с = откорректированная запись
*/
const RUSMARC_RECORD_STATUS = {
  [CORRECTED]: CORRECTED,
  [DELETED]: DELETED,
  [UNKNOWN]: UNKNOWN,
  ' ': UNKNOWN,
  '|': UNKNOWN,
  '#': UNKNOWN,
  '$': UNKNOWN,
  '0': UNKNOWN,
  [NEW]: NEW,
};

const RUSMARC_SCHEMA_URI = 'http://rusmarc.ru/soft/RUSMARC20191213.rar';
const RUSMARC_F100A_LENGTH = 36;

const RUSMARC_JSON_SCHEMA_PATH = path.join(__dirname, 'schemas/rusmarc/rusmarc-bibliographic-rsl-1.0.0.schema.json');
const RUSMARC_JSON_SCHEMA_URI = path.join('/schemas/rusmarc-bibliographic-rsl-1.0.0.schema.json');


module.exports = {
  RUSMARC_RECORD_STATUS,
  RUSMARC_JSON_SCHEMA_URI,
  RUSMARC_JSON_SCHEMA_PATH,
  RUSMARC_F100A_LENGTH,
  RUSMARC_SCHEMA_URI,
};