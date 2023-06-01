const path = require('path');
const fs = require('fs');
const { parseFieldRelationSeq } = require('../relations');
const { parseIdentifier } = require('../indentifiers');
const formats = require('../../index');
const { JSONLD_MEDIA_TYPE } = require('../../jsonld/constants');
const { cleanDatesAndUUIDs } = require('../../../utils/testHelpers');
const { jsonParseSafe } = require('../../../utils');
const { MARC_SCHEMAS } = require('../constants');
const { detectMarcSchemaUri } = require('../detect');
const { BASIC_ENTITIES } = require('../../../constants');
const { jsonStringifySafe } = require('../../../utils');
const { MARC_MEDIA_TYPE } = require('../constants');
const { getKind } = require('../detect');
const { omit } = require('../../../utils');

test('MARC21 with CP1251 -> entities', async () => {
  const input = fs.readFileSync(path.join(__dirname, 'data/1251.mrc'), 'ascii');
  const res = (await formats[MARC_MEDIA_TYPE].toEntities(input)).map(
    v => omit(v, ['time_source']),
  );
  expect(
    res,
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'data/1251.mrc.entity.json'), 'utf-8')).map(
      v => omit(v, ['time_source']),
    ),
  );
});

test('MARC21 with CP1251 -> objets', async () => {
  const input = fs.readFileSync(path.join(__dirname, 'data/1251.mrc'), 'ascii');
  const res = (await formats[MARC_MEDIA_TYPE].toObjects(input)).map(
    v => omit(v, ['time_source']),
  );
  expect(
    res.map(v => omit(v, ['time_source'])).map((rec) => ({
      ...rec,
      leader: rec.leader.replace(/^[0-9]{5}/ug, '00000'),
    })),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'data/1251.mrc.record.json'), 'utf-8')).map(
      v => omit(v, ['time_source']),
    ).map((rec) => ({
      ...rec,
      leader: rec.leader.replace(/^[0-9]{5}/ug, '00000'),
    })),
  );
});

test('MARC21 with Unicode with leader flag -> entities', async () => {
  const input = fs.readFileSync(path.join(__dirname, 'data/utf8_with_leader_flag.mrc'));
  const converted = await formats[MARC_MEDIA_TYPE].toEntities(input);

  const ref = fs.readFileSync(path.join(__dirname, 'data/utf8_with_leader_flag.mrc.entity.json'), 'utf-8');

  expect(
    converted.map(v => omit(v, ['time_source'])),
  ).toEqual(
    JSON.parse(ref).map(v => omit(v, ['time_source'])),
  );
});

test('MARC21 with Unicode with leader flag -> objects', async () => {
  const input = fs.readFileSync(path.join(__dirname, 'data/utf8_with_leader_flag.mrc'));
  const converted = await formats[MARC_MEDIA_TYPE].toObjects(input);

  const ref = fs.readFileSync(path.join(__dirname, 'data/utf8_with_leader_flag.mrc.record.json'), 'utf-8');

  expect(
    converted.map(v => omit(v, ['time_source'])),
  ).toEqual(
    JSON.parse(ref).map(v => omit(v, ['time_source'])),
  );
});

test('MARC21 with Unicode without leader flag -> entities', async () => {
  const input = fs.readFileSync(path.join(__dirname, 'data/utf8_without_leader_flag.mrc'));
  const ref = fs.readFileSync(path.join(__dirname, 'data/utf8_without_leader_flag.mrc.entity.json'), 'utf-8');
  const converted = await formats[MARC_MEDIA_TYPE].toEntities(input);
  expect(
    converted.map(v => omit(v, ['time_source'])),
  ).toEqual(
    JSON.parse(ref).map(v => omit(v, ['time_source'])),
  );
});

test('MARC21 with Unicode without leader flag -> objects', async () => {
  const input = fs.readFileSync(path.join(__dirname, 'data/utf8_without_leader_flag.mrc'));
  const ref = fs.readFileSync(path.join(__dirname, 'data/utf8_without_leader_flag.mrc.record.json'), 'utf-8');
  const converted = await formats[MARC_MEDIA_TYPE].toObjects(input);
  expect(
    converted.map(v => omit(v, ['time_source'])),
  ).toEqual(
    JSON.parse(ref).map(v => omit(v, ['time_source'])),
  );
});

test('parseUriRelationSeq', () => {
  expect(parseIdentifier('catalog.rsl.ru/resources/instance/RuMoRGB-rsl')).toEqual({
    'key_to': 'resources/instance/RuMoRGB-rsl',
    'source_to': 'catalog.rsl.ru',
  });
  expect(parseIdentifier('(RuMoRGB)01010079565')).toEqual({
    'key_to': '01010079565',
    'source_to': 'RuMoRGB',
  });

});

test('parseFieldRelationSeq', () => {
  expect(parseFieldRelationSeq('1.1\\a')).toEqual([1, 1, 'a']);
  expect(parseFieldRelationSeq('1.1\\aa')).toEqual(null);
  expect(parseFieldRelationSeq('1\\a')).toEqual([1, null, 'a']);
});

test('detect', () => {
  const jsonEntity = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, 'data/dates_1_marc21.json'),
      'utf-8',
    ),
  );
  expect(getKind(jsonEntity)).toEqual(BASIC_ENTITIES.INSTANCE);

  expect(detectMarcSchemaUri(jsonEntity)).toEqual(MARC_SCHEMAS.MARC21.uri);
});


test('no key regression', async () => {
  const input = fs.readFileSync(path.join(__dirname, 'data/nokey.mrc'));
  const res = await formats[MARC_MEDIA_TYPE].toEntities(input);
  expect(
    cleanDatesAndUUIDs(jsonParseSafe(jsonStringifySafe(res))),
  ).toEqual(
    cleanDatesAndUUIDs(jsonParseSafe(fs.readFileSync(path.join(__dirname, 'data/nokey.json'), 'utf-8'))),
  );
});

describe.skip('rusmarc -> marc 21', () => {


test('MARC21 -> OPDS vs same RUSMARC -> OPDS rsl01002988236', async () => {
  expect.assertions(1);
  const marc21Json = (await formats[MARC_MEDIA_TYPE].to[JSONLD_MEDIA_TYPE](
    fs.readFileSync(path.join(__dirname, 'history_xvii/RuMoRGB/01002988236_marc21.mrc'), 'utf-8'),
  ));
  const rusmarcMappedJson = await formats[MARC_MEDIA_TYPE].to[JSONLD_MEDIA_TYPE](
    fs.readFileSync(path.join(__dirname, 'history_xvii/RuMoRGB/01002988236_rusmarc.iso'), 'utf-8'),
  );
  expect(
    rusmarcMappedJson,
  ).toEqual(
    marc21Json,
  );
}, 60 * 1000);

  test('mapping rusmarc -> marc - ISBN-978-5-901202-50-0', async () => {
    expect.assertions(1);
    const marc21Json = (await formats[MARC_MEDIA_TYPE].toObjects(
      fs.readFileSync(path.join(__dirname, 'data/ISBN-978-5-901202-50-0/01003120729.mrc'), 'utf-8'),
    ));
    // to['http://rusmarc.ru/soft/RUSMARC20191213.rar']
    const rusmarcMappedJson = await formats[MARC_MEDIA_TYPE].toObjects(
      fs.readFileSync(path.join(__dirname, 'data/ISBN-978-5-901202-50-0/01003120729.iso'), 'utf-8'),
    );
    expect(
      rusmarcMappedJson.map((rec) => ({
        ...rec,
        leader: rec.leader.replace(/^[0-9]{5}/ug, '00000'),
      })),
    ).toEqual(
      marc21Json,
    );
  }, 60 * 1000);


  test('mapping rusmarc -> marc - rsl01002988236 VS NLR005177748.mrc', async () => {
    expect.assertions(1);
    const marc21Json = await formats[MARC_MEDIA_TYPE].to[JSONLD_MEDIA_TYPE](
      fs.readFileSync(path.join(__dirname, 'history_xvii/RuMoRGB/01002988236_marc21.mrc')),
    );
    const rusmarcMappedJson = await formats[MARC_MEDIA_TYPE].to[JSONLD_MEDIA_TYPE](
      fs.readFileSync(path.join(__dirname, 'history_xvii/RuSpRNB/NLR005177748.mrc')),
    );
    expect(
      rusmarcMappedJson,
    ).toEqual(
      marc21Json,
    );
  }, 15 * 1000);
});
