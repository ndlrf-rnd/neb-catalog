/**
 * @fileOverview MARC21 utilities and formats
 */
const {
  splitRecords,
  fromISO2709,
  toISO2709,
} = require('./iso2709');

const { describeField, getMarcField, parseFieldStr } = require('./fields');
const { parseFieldRelationSeq } = require('./relations');
const { detectMarcSchemaUri, getKind } = require('./detect');

module.exports = {
  describeField,

  detectMarcSchemaUri,
  getKind,
  getMarcField,

  parseFieldRelationSeq,
  parseFieldStr,
  splitRecords,
  fromISO2709,
  toISO2709,
};
