const fs = require('fs');
const path = require('path');
const { JSONLD_MEDIA_TYPE } = require('../../jsonld/constants');
const { OPDS2_MEDIA_TYPE } = require('../../opds2/constants');
const {
  jsonStringifySafe,
  cpMap,
  flatten,
} = require('../../../utils');
const { toEntities, to } = require('../index');

test('N-Quads', async () => {

  expect.assertions(2);
  const input = fs.createReadStream(path.join(__dirname, './input-1.nq'), 'utf-8');
  const quadEntities = await toEntities(input);
  expect(
    quadEntities,
  ).toEqual(
    JSON.parse(
      fs.readFileSync(path.join(__dirname, './output-1.entities.json'), 'utf-8'),
    ),
  );
  const quadObjects = flatten(await cpMap(
    quadEntities,
    async ({ record }) => to[OPDS2_MEDIA_TYPE](record),
  ));
  expect(
    JSON.parse(jsonStringifySafe(quadObjects)),
  ).toEqual(
    JSON.parse(
      fs.readFileSync(path.join(__dirname, './output-1.objects.json'), 'utf-8'),
    ),
  );
}, 10 * 1000);

test('UDC', async () => {
  expect.assertions(2);
  const input = fs.createReadStream(path.join(__dirname, './UDC_2020-04-29_15-57-33.nq'), 'utf-8');
  const quadEntities = await toEntities(input);
  expect(
    quadEntities,
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, './UDC_2020-04-29_15-57-33-entities.json'), 'utf-8')),
  );
  const quadObjects = flatten(await cpMap(
    quadEntities,
    async ({ record }) => to[OPDS2_MEDIA_TYPE](record),
  ));
  expect(
    JSON.parse(jsonStringifySafe(quadObjects)),
  ).toEqual(
    JSON.parse(
      fs.readFileSync(path.join(__dirname, './UDC_2020-04-29_15-57-33-objects.json'), 'utf-8'),
    ),
  );
}, 2 * 60 * 1000);


test('JSON-LD', async () => {
  expect.assertions(1);
  const input = fs.createReadStream(path.join(__dirname, './UDC_2020-04-29_15-57-33.nq'), 'utf-8');
  const quadEntities = await toEntities(input);
  const jsonLdData = flatten(await cpMap(
    quadEntities,
    async ({ record }) => to[JSONLD_MEDIA_TYPE](record),
  ));
  expect(
    jsonLdData,
  ).toEqual(
    JSON.parse(
      fs.readFileSync(path.join(__dirname, './UDC_2020-04-29_15-57-33.jsonld'), 'utf-8'),
    ),
  );
}, 10 * 1000);
