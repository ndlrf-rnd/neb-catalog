const path = require('path');
const fs = require('fs');
const formats = require('../../index');
const { deserialize } = require('../deserialize');
const { OPDS2_MEDIA_TYPE } = require('../../opds2/constants');
const { cpMap, flattenDeep } = require('../../../utils');
const { RAS_JES_SU_MEDIA_TYPE } = require('../constants');

test('JES -> opds2', async () => {
  expect.assertions(1);
  let res;
  let ref;
  const entities = await formats[RAS_JES_SU_MEDIA_TYPE].toEntities(
    fs.readFileSync(path.join(__dirname, 'artsoc-2019-2.xml'), 'utf-8'),
    { upload: false },
  );
  // const fn = formats[OPDS2_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE];
  res = flattenDeep(await cpMap(
    entities,
    async ({ record, media_type }) => await formats[OPDS2_MEDIA_TYPE].to[OPDS2_MEDIA_TYPE](record, { upload: false }),
  ));
  ref = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'artsoc-2019-2.opds2.json'), 'utf-8'),
  );
  expect(res).toEqual(ref);
}, 60 * 1000);


test('Decode XML-escaped serialized PHP Object', () => {
  const XML_PHP_INPUT = encodeURIComponent(
    'a:2:{i:0;a:2:{s:4:"text";s:36:"<h1 id="heading-1">Test Article</h1>";s:7:"comment";s:0:"";}i:1;a:2:{s:4:"text";s:28:"<p>Test article content.</p>";s:7:"comment";s:15:"Text of comment";}}',
  ).replace(/[ ]/ug, '+');
  expect(
    deserialize(XML_PHP_INPUT),
  ).toEqual([
    {
      'comment': '',
      'text': '<h1 id="heading-1">Test Article</h1>',
    },
    {
      'comment': 'Text of comment',
      'text': '<p>Test article content.</p>',
    },
  ]);
}, 60 * 1000);

test('Decode serialized PHP Object', () => {
  const PHP_INPUT = 'a:2:{i:0;a:2:{s:4:"text";s:36:"<h1 id="heading-1">Test Article</h1>";s:7:"comment";s:0:"";}i:1;a:2:{s:4:"text";s:28:"<p>Test article content.</p>";s:7:"comment";s:15:"Text of comment";}}';
  expect(
    deserialize(PHP_INPUT),
  ).toEqual([
    {
      'comment': '',
      'text': '<h1 id="heading-1">Test Article</h1>',
    },
    {
      'comment': 'Text of comment',
      'text': '<p>Test article content.</p>',
    },
  ]);
}, 60 * 1000);
