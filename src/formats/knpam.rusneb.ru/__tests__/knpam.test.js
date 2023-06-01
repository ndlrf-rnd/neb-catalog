const fs = require('fs');
const path = require('path');
const { omit } = require('../../../utils');
const { toEntities } = require('./../index');
const formats=require('../../../formats')
const { jsonStringifySafe } = require('../../../utils');
const { KNPAM_RUSNEB_RU_MEDIA_TYPE } = require('../constants');
const { OPDS2_MEDIA_TYPE } = require('../../opds2/constants');
test('knppam -> entities', async () => {
  const entities = await toEntities(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixture.json'), 'utf-8')));
  expect(
    JSON.parse(jsonStringifySafe(entities))
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'knpam.entities.json'), 'utf-8')),
  );
});


test('knpam -> opds2', async () => {
  const objects = await formats[KNPAM_RUSNEB_RU_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](
    JSON.parse(fs.readFileSync(path.join(__dirname, 'fixture.json'), 'utf-8'))
  );
  expect(
    JSON.parse(jsonStringifySafe(objects))
  ).toEqual(
    JSON.parse(fs.readFileSync( path.join(__dirname, 'knpam.opds2.json'), 'utf-8')),
  );
});

