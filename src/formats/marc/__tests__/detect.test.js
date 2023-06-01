const path = require('path');
const fs = require('fs');
const { BASIC_ENTITIES } = require('../../../constants');
const { MARC_RECORD_FORMATS } = require('../constants-formats');
const { MARC_SCHEMAS } = require('../constants');
const { detectMarcSchemaUri, getKind } = require('../detect');

const jsonEntity = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'data', 'dates_1_marc21.json'),
    'utf-8',
  ),
);

test('detect MARC record kind', () => {
  expect(
    getKind(jsonEntity),
  ).toEqual(
    BASIC_ENTITIES.INSTANCE,
  );
});

test('detect MARC fork', () => {
  expect(
    detectMarcSchemaUri(jsonEntity),
  ).toEqual(
    MARC_SCHEMAS.MARC21.uri,
  );
});