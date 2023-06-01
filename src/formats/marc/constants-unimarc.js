const fs = require('fs');
const path = require('path');
const {MARC_RECORD_FORMATS} = require('./constants-formats')

/*
Тип записи (позиция символа 6)
Используются следующие коды, обозначающие тип записи:
x = авторитетная / нормативная запись
Код "x" указывает, что запись является авторитетной / нормативной;
поле 2-- содержит точку доступа, которая может использоваться для создания точек доступа в библиографической записи.

y = ссылочная запись
Код "y" указывает, что запись является ссылочной;
поле 2-- содержит вариантную точку доступа, которая не может использоваться для создания
точек доступа в библиографической записи.
Точка доступа из поля 2-- ссылочной записи приводится в поле 4-- авторитетной / нормативной
записи для формирования ссылки.

z = справочная запись
Код "z" указывает, что запись является справочной;
поле 2-- содержит пояснительную точку доступа, которая не может использоваться для создания точек доступа в библиографической записи, и не приводится в поле 4-- авторитетной / нормативной записи для формирования ссылки.

*/

const UNIMARC_RECORD_TYPE_GROUP_CODES = {
  [MARC_RECORD_FORMATS.HOLDINGS]: [],
  [MARC_RECORD_FORMATS.AUTHORITY]: ['x', 'y', 'z'],
  [MARC_RECORD_FORMATS.CLASSIFICATION]: ['w'],
  [MARC_RECORD_FORMATS.BIBLIOGRAPHIC]: [
    'l', // ELECTRONIC
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'n',
    'o',
    'p',
    'r',
    't',
  ],
};
const UNIMARC_SCHEMA_URI = 'https://www.ifla.org/publications/unimarc-formats-and-related-documentation';

const UNIMARC_JSON_SCHEMA_PATH = path.join(__dirname, 'schemas/unimarc/unimarc-bibliographic-rsl-1.0.0.schema.json');
const UNIMARC_JSON_SCHEMA_URI = '/schemas/unimarc-bibliographic-rsl-1.0.0.schema.json';
const RUSMARC_F100A_TYPE_OF_RANGE_OFFSET = 8;
module.exports = {
  UNIMARC_JSON_SCHEMA_URI,
  UNIMARC_RECORD_TYPE_GROUP_CODES,
  UNIMARC_SCHEMA_URI,
  RUSMARC_F100A_TYPE_OF_RANGE_OFFSET,
  UNIMARC_JSON_SCHEMA_PATH,
};