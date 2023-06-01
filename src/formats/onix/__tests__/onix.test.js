const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const { ONIX_MEDIA_TYPE } = require('../constants');
const formats = require('../../index');
const { OPDS2_MEDIA_TYPE } = require('../../opds2/constants');
const { MARCXML_MEDIA_TYPE } = require('../../marcxml/constants');

const to =formats[ONIX_MEDIA_TYPE].to

test('ONIX -> MARC21', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(
    path.join(__dirname, '../examples/single_product.xml'),
    'utf-8',
  );
  expect(
    await to[MARCXML_MEDIA_TYPE](input),
  ).toEqual(
    fs.readFileSync(path.join(__dirname, './single_product.marc21.mrx'), 'utf-8').replace(/[\r]+/uig, ''),
  );
});


test('ONIX -> OPDS2', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/single_product.xml'), 'utf-8');
  expect(
    await to[OPDS2_MEDIA_TYPE](input),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, './single_product.opds2.json'), 'utf-8')),
  );
});

test('ONIX T8 CP1251 -> MARCXML', async () => {
  expect.assertions(1);
  const input = iconv.decode(
    fs.readFileSync(path.join(__dirname, '../examples/t8-example-cp1251.xml')),
    'cp1251'
  ).toString().replace(/windows-1251/uig, 'UTF-8');
  expect(
    await to[MARCXML_MEDIA_TYPE](input),
  ).toEqual(
    fs.readFileSync(path.join(__dirname, './t8-example-cp1251.marc21.mrx'), 'utf-8').replace(/[\r]+/uig, ''),
  );
});

test('ONIX T8 CP1251 -> OPDS2', async () => {
  expect.assertions(1);
  const input = iconv.decode(
    fs.readFileSync(path.join(__dirname, '../examples/t8-example-cp1251.xml')),
    'cp1251',
  ).toString().replace(/windows-1251/uig, 'UTF-8');
  expect(
    await to[OPDS2_MEDIA_TYPE](input),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, './t8-example-cp1251.opds2.json'), 'utf-8')),
  );
});

test('ONIX T8 UTF-8 -> MARCXML', async () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '../examples/t8-example-utf-8.xml'), 'utf-8');
  expect(
    await to[MARCXML_MEDIA_TYPE](input),
  ).toEqual(
    fs.readFileSync(path.join(__dirname, './t8-example-utf-8.marc21.mrx'), 'utf-8').replace(/[\r]+/uig, ''),
  );
});

test('ONIX T8 UTF-8 -> OPDS2',  () => {
  const input = fs.readFileSync(path.join(__dirname, '../examples/t8-example-utf-8.xml'), 'utf-8');
  expect(
    to[OPDS2_MEDIA_TYPE](input.replace(/<\?[^>]+> *\n/uig, '')),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, './t8-example-utf-8.opds2.json'), 'utf-8')),
  );
});


test('ONIX 3 -> OPDS2',  () => {
  expect.assertions(1);
  const input = fs.readFileSync(path.join(__dirname, '..', 'examples/eksmo-books24-samples.onix-3.0.xml'));
  expect(
     to[OPDS2_MEDIA_TYPE](input),
  ).toEqual(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'eksmo-books24-samples.onix-3.0.opds2.json'), 'utf-8')),
  );
}, 30 * 1000);
