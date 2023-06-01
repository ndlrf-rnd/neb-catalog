const fs = require('fs');
const path = require('path');
const formats = require('../index');
const { jsonStringifySafe } = require('../../utils');
const { JSONLD_MEDIA_TYPE } = require('../jsonld/constants');
const { MARC_MEDIA_TYPE } = require('../marc/constants');
const { OPDS2_MEDIA_TYPE } = require('../opds2/constants');
const { detectMarcSchemaUri } = require('../marc/detect');

test('rusmarc -> marc part of series', async () => {
  expect.assertions(1);
  const rusmarcJson = await formats[MARC_MEDIA_TYPE].toObjects(
    fs.readFileSync(path.join(__dirname, 'series/NLR009671045.mrc'), 'utf-8'),
  );
  expect(
    rusmarcJson.map((rec) => ({
      ...rec,
      leader: rec.leader.replace(/^[0-9]{5}/ug, '00000'),
    })),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'NLR009671045.rusmarc.json'), 'utf-8')),
  );
}, 60 * 1000);

test('opds mapping - 1', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/1_marc21.mrc'), 'utf-8');
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/1_opds2.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(
    OUT,
  );
}, 60 * 1000);

test('opds mapping - 2', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/2_marc21.mrc'));
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/2_opds2.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
});

test('opds mapping - 3', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/3_marc21.mrc'), 'utf-8');
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/3_opds2.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
}, 60 * 1000);


test('opds mapping - 4', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/4_marc21.mrc'));
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/4_opds2.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
});

test('opds mapping - 6', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/6_marc21.mrc'));
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/6_opds2.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
}, 60 * 1000);

test('opds mapping - 7', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/7_rusmarc.mrc'), 'utf-8');
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/7_opds2.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
});

test('opds mapping - 8', async () => {
  expect.assertions(1);
  const IN = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/8_marc21.json'), 'utf-8'));
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/8_opds2.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
}, 60 * 1000);

test('003629471 to OPDS', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/003629471_marc21.mrc'), 'utf-8');
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/003629471_opds.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
});

test('005491281 to OPDS', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/005491281_marc21.mrc'), 'utf-8');
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/005491281_opds.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
}, 60 * 1000);

test('009913303 to OPDS', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/009913303_marc21.mrc'));
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/009913303_opds.json'), 'utf-8'));
  expect(await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN)).toEqual(OUT);
}, 60 * 1000);

test('dates to OPDS', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/004095450_marc21.mrc'));
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/004095450_opds.json')));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
});

test('Test language', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/RuSpRNB-009670326-rusmarc-language.mrc'));
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/RuSpRNB-009670326-marc21-language.json'), 'utf-8'));
  expect(
    (await formats[MARC_MEDIA_TYPE].toObjects(IN)).map((rec) => ({
      ...rec,
      leader: rec.leader.replace(/^[0-9]{5}/ug, '00000'),
    })),
  ).toEqual(OUT);
}, 60 * 1000);

test('Test language OPDS2', async () => {
  expect.assertions(1);
  const IN = fs.readFileSync(path.join(__dirname, 'data/RuSpRNB-009670326-rusmarc-language.mrc'));
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/RuSpRNB-009670326-opds2-language.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
});

test('Test rusmarc detection OPDS2', async () => {
  expect.assertions(2);
  const IN = fs.readFileSync(path.join(__dirname, 'data/rusmarc2marc-rusmarc.mrc'));
  const rec = (await formats[MARC_MEDIA_TYPE].toObjects(IN))[0];
  expect(detectMarcSchemaUri(rec),
  ).toEqual('/schemas/rusmarc-bibliographic-rsl-1.0.0.schema.json');
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/rusmarc2marc-opds.json'), 'utf-8'));
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](IN),
  ).toEqual(OUT);
}, 60 * 1000);


test('mapping rusmarc -> opds2 RuMoRGB.01003543129.marc21.mrc', async () => {
  expect.assertions(1);
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](
      fs.readFileSync(path.join(__dirname, 'series/RuMoRGB.01003543129.1.rusmarc.iso')),
    ),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'series/RuMoRGB.01003543129.rusmarc.opds2.json'), 'utf-8')),
  );
}, 60 * 1000);


test('series RuMoRGB.01003543129.marc21 to OPDS', async () => {
  expect.assertions(1);
  expect(
    await formats[MARC_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](
      fs.readFileSync(path.join(__dirname, 'series/RuMoRGB.01003543129.1.marc21.mrc')),
      OPDS2_MEDIA_TYPE,
    ),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'series', 'RuMoRGB.01003543129.opds2.json'), 'utf-8')),
  );
}, 60 * 1000);
test('series RuMoRGB.01003543129.marc21 to Objects', async () => {
  expect.assertions(1);
  expect(
    await formats[MARC_MEDIA_TYPE].toObjects(
      fs.readFileSync(path.join(__dirname, 'series/RuMoRGB.01003543129.1.marc21.mrc')),
    ),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'series', 'RuMoRGB.01003543129.objects.json'), 'utf-8')),
  );
}, 60 * 1000);
test('series RuMoRGB.01003543129.marc21 to Entities', async () => {
  expect.assertions(1);
  expect(
      jsonStringifySafe(await formats[MARC_MEDIA_TYPE].toEntities(
        fs.readFileSync(path.join(__dirname, 'series/RuMoRGB.01003543129.1.marc21.mrc'), 'utf-8'),
      ))
  ).toEqual(
    jsonStringifySafe(JSON.parse(fs.readFileSync(path.join(__dirname, 'series', 'RuMoRGB.01003543129.entities.json'), 'utf-8'))),
  );
}, 60 * 1000);


test('broken time', async () => {
  expect.assertions(1);
  expect(
    await formats[MARC_MEDIA_TYPE].toObjects(
      fs.readFileSync(path.join(__dirname, 'data/rsl_10_broken.mrc')),
    ),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'data/rsl_10_broken.json'), 'utf-8')),
  );
}, 60 * 1000);

