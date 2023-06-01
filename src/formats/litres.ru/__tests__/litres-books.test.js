const path = require('path');
const fs = require('fs');
const formats = require('../../../formats');
const { flattenDeep } = require('../../../utils');
const { cpMap } = require('../../../services/catalog/static/app/auto-former/promises');
const { j2x, forceArray, x2j, jsonataRunner, jsonParseSafe, jsonStringifySafe } = require('../../../utils');
const { LITRES_RU_XML_ENCODING, LITRES_RU_XML_MEDIA_TYPE } = require('../constants');
const { OPDS2_MEDIA_TYPE } = require('../../opds2/constants');

// test.skip('Enrich JES', async () => {
//   expect.assertions(1);
//   const richJesData = await cpMap(
//     JSON.parse(fs.readFileSync(path.join(__dirname, 'jes', 'artsoc-2019-2.json'), 'utf-8'),
//       async j => await enrichJes(j),
//     ),
//   );
//   expect(
//     richJesData,
//   ).toEqual(
//     JSON.parse(
//       fs.readFileSync(
//         path.join(__dirname, 'jes', 'artsoc-2019-2.enriched.json'),
//         'utf-8',
//       ),
//     ),
//   );
// }, 60 * 1000);

test('Litres -> application/opds+json - single unavailable item', () => {

  let res;
  let ref;
  res = jsonStringifySafe(
    formats[LITRES_RU_XML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](
      fs.readFileSync(
        path.join(__dirname, 'audio-single-unavailable.xml'),
        LITRES_RU_XML_ENCODING,
      ),
    ), null, 2,
  );
  ref = jsonStringifySafe(jsonParseSafe(fs.readFileSync(
    path.join(__dirname, 'audio-single-unavailable.opds2.json'),
    'utf-8',
  )), null, 2);
  expect(res).toBeTruthy();
  expect(res).toEqual(ref);
}, 10 * 60 * 1000);

test('Litres -> application/opds+json - single available item', () => {
  let res;
  let ref;
  res = jsonStringifySafe(formats[LITRES_RU_XML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](
    fs.readFileSync(
      path.join(__dirname, 'audio-single-available.xml'),
      LITRES_RU_XML_ENCODING,
    ),
  ), null, 2);
  ref = jsonStringifySafe(JSON.parse(
    fs.readFileSync(
      path.join(__dirname, 'audio-single-available.opds2.json'),
      'utf-8',
    ),
  ), null, 2);
  expect(res).toBeTruthy();
  expect(res).toEqual(ref);
}, 10 * 60 * 1000);

test('Litres -> application/opds+json', async () => {
  let res;
  let ref;
  res = await formats[LITRES_RU_XML_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](
    fs.readFileSync(path.join(__dirname, 'audio-fresh.xml'), LITRES_RU_XML_ENCODING),
  );
  ref = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'audio-fresh.opds2.json'), 'utf-8'),
  );
  expect(res).toBeTruthy();
  expect(res).toEqual(ref);
}, 10 * 60 * 1000);

// test('Litres -> toObjects', () => {
//   let res;
//   let ref;
//   res = await formats[LITRES_RU_XML_MEDIA_TYPE].toObjects(
//     fs.readFileSync(
//       path.join(__dirname, 'audio-fresh.xml'),
//       LITRES_RU_XML_ENCODING,
//     ),
//   );
//   ref = JSON.parse(
//     fs.readFileSync(
//       path.join(__dirname, 'audio-fresh.objects.json'),
//       'utf-8',
//     ),
//   );
//   // expect(res).toBeTruthy();
//   expect(JSON.parse(JSON.stringify(res))).toEqual(ref);
// },10 * 60 * 1000);

test('Litres - toEntities', async () => {
  expect.assertions(1);

  const res = jsonStringifySafe(
    flattenDeep(
      await cpMap(
        x2j(fs.readFileSync(path.join(__dirname, 'audio-fresh.xml'))).elements,
        async record => {
          const recJson = {
            declaration: {
              attributes: {
                version: '1.0',
                encoding: 'UTF-8',
              },
            },
            elements: forceArray(record),
          };
          return formats[LITRES_RU_XML_MEDIA_TYPE].toEntities(j2x(recJson));
        },
      ),
    ),
    null,
    2
  );
  const ref = jsonStringifySafe(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'audio-fresh.entities.json'), 'utf-8')),
    null,
    2,
  );
  expect(res).toEqual(ref);
}, 60 * 1000);
