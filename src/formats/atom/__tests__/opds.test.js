const fs = require('fs');
const path = require('path');
const { ATOM_MEDIA_TYPE } = require('../constants');
const { OPDS2_MEDIA_TYPE } = require('../../opds2/constants');
const formats = require('../../index');
const { jsonStringifySafe } = require('../../../utils');

const FEED_STR = fs.readFileSync(path.join(__dirname, 'dc.mkrf.ru-2020-07-17.xml'), 'utf-8');
test('Entities import', async () => {
  expect.assertions(1);
  expect(
    await formats[ATOM_MEDIA_TYPE].toEntities(FEED_STR),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'dc.mkrf.ru-2020-07-17.entities.json'), 'utf-8')),
  );
}, 60 * 1000);

test('OPDS2 import', async () => {
  expect.assertions(1);
  expect(
    formats[ATOM_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](FEED_STR),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'dc.mkrf.ru-2020-07-17.opds2.json'), 'utf-8')),
  );
}, 60 * 1000);
