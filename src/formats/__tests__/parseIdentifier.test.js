const { parseIdentifier } = require('../marc/indentifiers');

test('parseIdentifier - valid', () => {
  expect(
    parseIdentifier('(RuMoRGB)009993882 ', null, false),
  ).toEqual({
    source: 'RuMoRGB',
    key: '009993882',
  });

  expect(
    parseIdentifier('(RuMoRGB)009993882 ', null, true),
  ).toEqual({
    source_to: 'RuMoRGB',
    key_to: '009993882',
  });

  expect(
    parseIdentifier('RuMoRGB/009993882 ', null, false),
  ).toEqual({
    source: 'RuMoRGB',
    key: '009993882',
  });

  expect(
    parseIdentifier('(RuMoRGB)/009993882 ', null, false),
  ).toEqual({
    source: 'RuMoRGB',
    key: '/009993882',
  });

  expect(
    parseIdentifier('(RuMoRGB)MEKACOL-0031344', null, false),
  ).toEqual({
    source: 'RuMoRGB',
    key: 'MEKACOL-0031344',
  });

  expect(
    parseIdentifier('(DLC)###59003745#', null, false),
  ).toEqual({
    source: 'DLC',
    key: '59003745',
  });

});


test('parseIdentifier - invalid', () => {
  expect(
    parseIdentifier('DLC)###59003745#'),
  ).toEqual(null);

  expect(
    parseIdentifier('(DLC###59003745#'),
  ).toEqual(null);

  expect(
    parseIdentifier('###59003745#(DLC)'),
  ).toEqual(null);

  expect(
    parseIdentifier('(DLC)'),
  ).toEqual(null);

  expect(
    parseIdentifier('###59003745#'),
  ).toEqual(null);

});
