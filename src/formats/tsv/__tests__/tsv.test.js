const formats = require('../../index');
const { removeDates } = require('../../../utils/testHelpers');
const { jsonStringifySafe } = require('../../../utils');
const { TSV_MEDIA_TYPE } = require('../constants');

test('TSV - toObjects', () => {
  const DATA = [
    `kind	source	key	record.text`,
    `archive_component	knpam.rusneb.ru	002986620	Берх,Василий Николаевич (1781-1834). Путешествие в города Чердынь и Соликамск. : Для изъискания исторических древностей .- Санктпетербург : Печатано в Военной типографии Главнаго штаба его императорскаго величества, 1821. - [14], 234 с.`,
    '',
  ].join('\n');
  expect(
    formats[TSV_MEDIA_TYPE].toObjects(DATA),
  ).toEqual([
    {
      'key': '002986620',
      'kind': 'archive_component',
      'record': {
        'text': 'Берх,Василий Николаевич (1781-1834). Путешествие в города Чердынь и Соликамск. : Для изъискания исторических древностей .- Санктпетербург : Печатано в Военной типографии Главнаго штаба его императорскаго величества, 1821. - [14], 234 с.',
      },
      'source': 'knpam.rusneb.ru',
    },
  ]);
});

test('TSV - toObjects - column', () => {
  const DATA = [
    [
      `value`,
      'kind',
      'source',
      'key',
      'path',
    ],
    [
      `Берх,Василий Николаевич (1781-1834). Путешествие в города Чердынь и Соликамск. : Для изъискания исторических древностей .- Санктпетербург : Печатано в Военной типографии Главнаго штаба его императорскаго величества, 1821. - [14], 234 с.`,
      'archive_component',
      'knpam.rusneb.ru',
      '002986620',
      'record.text.0',
    ],
    [
      `Еще один проверочный блок текста`,
      'archive_component',
      'knpam.rusneb.ru',
      '002986620',
      'record.text.1',
    ],
  ].map(v => v.join('\t')).join('\n');
  expect(
    formats[TSV_MEDIA_TYPE].toObjects(DATA),
  ).toEqual(
    [
      {
        'key': '002986620',
        'kind': 'archive_component',
        'record': [
          'value\tkind\tsource\tkey\tpath',
          'Берх,Василий Николаевич (1781-1834). Путешествие в города Чердынь и Соликамск. : Для изъискания исторических древностей .- Санктпетербург : Печатано в Военной типографии Главнаго штаба его императорскаго величества, 1821. - [14], 234 с.\tarchive_component\tknpam.rusneb.ru\t002986620\trecord.text.0',
          'Еще один проверочный блок текста\tarchive_component\tknpam.rusneb.ru\t002986620\trecord.text.1',
        ].join('\n'),
        'source': 'knpam.rusneb.ru',
      },
    ],
  );
});

test('TSV - toEntities', async () => {
  expect.assertions(1);

  const DATA = [
    `kind	source	key	record.text`,
    `archive_component	knpam.rusneb.ru	002986620	Берх,Василий Николаевич (1781-1834). Путешествие в города Чердынь и Соликамск. : Для изъискания исторических древностей .- Санктпетербург : Печатано в Военной типографии Главнаго штаба его императорскаго величества, 1821. - [14], 234 с.`,
    '',
  ].join('\n');
  expect(
    removeDates(await formats[TSV_MEDIA_TYPE].toEntities(DATA)),
  ).toEqual(
    removeDates([
        {
          'key': '002986620',
          'kind': 'archive_component',
          'mediaType': 'text/tab-separated-values',
          'record': 'kind\tsource\tkey\trecord.text\narchive_component\tknpam.rusneb.ru\t002986620\tБерх,Василий Николаевич (1781-1834). Путешествие в города Чердынь и Соликамск. : Для изъискания исторических древностей .- Санктпетербург : Печатано в Военной типографии Главнаго штаба его императорскаго величества, 1821. - [14], 234 с.\n',
          'source': 'knpam.rusneb.ru',
          'time': [
            '2020-08-21T18:53:34.269Z',
            null,
          ],
          'time_source': [
            '2020-08-21T18:53:34.269Z',
            null,
          ],
        },
      ],
    ));
});

test('TSV toObjects - relation without header and trailing newline', () => {
  const DATA = `archive_component	knpam.rusneb.ru	002986620	bf:accompanies	instance	RuMoRGB	002986620`;
  expect(
    formats[TSV_MEDIA_TYPE].toObjects(DATA),
  ).toEqual([
    [
      'archive_component',
      'knpam.rusneb.ru',
      '002986620',
      'bf:accompanies',
      'instance',
      'RuMoRGB',
      '002986620',
    ],
  ]);
});

test('TSV toEntities - entity without header and trailing newline', async () => {
  expect.assertions(1);
  const DATA = `archive_component	knpam.rusneb.ru	002986620	bf:accompanies	instance	RuMoRGB	002986620`;
  expect(
    removeDates(JSON.parse(jsonStringifySafe(
      await formats[TSV_MEDIA_TYPE].toEntities(DATA),
    ))),
  ).toEqual(
    removeDates(
      [
        {
          'mediaType': 'text/tab-separated-values',
          'record': 'archive_component\tknpam.rusneb.ru\t002986620\tbf:accompanies\tinstance\tRuMoRGB\t002986620',
          'time': [
            '2020-08-21T18:58:41.735Z',
            null,
          ],
          'time_source': [
            '2020-08-21T18:58:41.735Z',
            null,
          ],
        },
      ],
    ));
});

test('TSV toObjects - relation w/o trailing newline', () => {
  const DATA = [
    `kind_from	source_from	key_from	relation_kind	kind_to	source_to	key_to`,
    `archive_component	knpam.rusneb.ru	002986620	bf:accompanies	instance	RuMoRGB	002986620`,
  ].join('\n');

  expect(
    formats[TSV_MEDIA_TYPE].toObjects(DATA),
  ).toEqual([
    {
      'key_from': '002986620',
      'key_to': '002986620',
      'kind_from': 'archive_component',
      'kind_to': 'instance',
      'relation_kind': 'bf:accompanies',
      'source_from': 'knpam.rusneb.ru',
      'source_to': 'RuMoRGB',
    },
  ]);
});

test('TSV toObjects - relation', () => {
  const DATA = [
    `kind_from	source_from	key_from	relation_kind	kind_to	source_to	key_to`,
    `archive_component	knpam.rusneb.ru	002986620	bf:accompanies	instance	RuMoRGB	002986620`,
    '',
  ].join('\n');
  expect(formats[TSV_MEDIA_TYPE].toObjects(DATA)).toEqual([
    {
      'key_from': '002986620',
      'key_to': '002986620',
      'kind_from': 'archive_component',
      'kind_to': 'instance',
      'relation_kind': 'bf:accompanies',
      'source_from': 'knpam.rusneb.ru',
      'source_to': 'RuMoRGB',
    },
  ]);
});
