const fs = require('fs');
const path = require('path');
const { MARCXML_MEDIA_TYPE } = require('../constants');
const formats = require('../../index');
const { MARC_MEDIA_TYPE } = require('../../marc/constants');
const { forceArray, jsonStringifySafe } = require('../../../utils');
const { OPDS2_MEDIA_TYPE } = require('../../opds2/constants');

const normalizeRecords = entities => forceArray(entities).map(
  entity => JSON.parse(jsonStringifySafe({
      ...entity,
      ...(entity.record
        ? { record: entity.record.replace(/ *[\r\n]+ */uig, ' ') }
        : {}),
    }),
  ));

test('Svod marcxml files to object', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-18-partial.mrx'), 'utf-8');
  const result = formats[MARCXML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-18-reduced.opds2.json'), 'utf-8'))),
  );
});

test('Svod marcxml files to entities', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-18-partial.mrx'), 'utf-8');
  const result = await formats[MARCXML_MEDIA_TYPE].toEntities(input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-18-reduced.entities.json'), 'utf-8'))),
  );
});

test('Svod marcxml files import to OPDS2', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-18-partial.mrx'), 'utf-8');
  const result = await formats[MARCXML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-18-reduced.opds2.json'), 'utf-8'))),
  );
});

test('MARCXML - Svod (RUSMARCC) - Problematic date 1 (2 excessive etters after year', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-date-problem-1.mrx'), 'utf-8');
  const result = await formats[MARCXML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-date-problem-1.opds2.json'), 'utf-8'))),
  );
});

test('MARCXML - Svod (RUSMARCC) - Problematic date 2', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-date-problem-2.mrx'), 'utf-8');
  const result = await formats[MARCXML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-date-problem-2.opds2.json'), 'utf-8'))),
  );
});
test('MARCXML - Svod (RUSMARCC) - Problematic date 3', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-date-problem-3.mrx'), 'utf-8');
  const result = await formats[MARCXML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-date-problem-3.opds2.json'), 'utf-8'))),
  );
});
test('MARCXML - Svod (RUSMARCC) - Problematic date 4', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-date-problem-4.mrx'), 'utf-8');
  const result = await formats[MARCXML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-date-problem-4.opds2.json'), 'utf-8'))),
  );
});
test('MARCXML - Svod (RUSMARCC) - Problematic date 5', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-date-problem-5.mrx'), 'utf-8');
  const result = await formats[MARCXML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-date-problem-5.opds2.json'), 'utf-8'))),
  );
});
test('MARCXML - Svod (RUSMARCC) - Problematic date 6', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-date-problem-6.mrx'), 'utf-8');
  const result = await formats[MARCXML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-date-problem-6.opds2.json'), 'utf-8'))),
  );
});
test('MARCXML - Svod (RUSMARCC) - Problematic date 7', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-date-problem-7.mrx'), 'utf-8');
  const result = await formats[MARCXML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-date-problem-7.opds2.json'), 'utf-8'))),
  );
});

test('MARCXML - Svod (RUSMARCC) - Problematic date 8 mrc', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/svod-date-problem-8.mrc'), 'utf-8');
  const result = await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](input);
  expect(
    normalizeRecords(result),
  ).toEqual(
    normalizeRecords(JSON.parse(fs.readFileSync(path.join(__dirname, 'svod-date-problem-8.opds2.json'), 'utf-8'))),
  );
});
