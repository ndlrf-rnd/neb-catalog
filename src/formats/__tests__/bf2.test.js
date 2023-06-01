const fs = require('fs');
const path = require('path');
const formats = require('../index');
const { JSONLD_MEDIA_TYPE } = require('../jsonld/constants');
const { MARC_MEDIA_TYPE } = require('../marc/constants');

describe.skip('bf2', () => {

  test('bf mapping - 1', async () => {
    expect.assertions(1);
    const IN = fs.readFileSync(path.join(__dirname, 'data/1_marc21.mrc'), 'utf-8');
    const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/1_bibframe2.json'), 'utf-8'));
    expect(
      await formats[MARC_MEDIA_TYPE].to[JSONLD_MEDIA_TYPE](IN),
    ).toEqual(
      OUT,
    );
  });


  test('bf mapping - 2', async () => {
    expect.assertions(1);
    const IN = fs.readFileSync(path.join(__dirname, 'data/2_marc21.mrc'), 'utf-8');
    const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/2_bibframe2.json'), 'utf-8'));
    expect(
      await formats[MARC_MEDIA_TYPE].to[JSONLD_MEDIA_TYPE](IN),
    ).toEqual(OUT);
  });
  test('jsonld bf2 mapping - 3', async () => {
    expect.assertions(1);
    const IN = fs.readFileSync(path.join(__dirname, 'data/3_marc21.mrc'), 'utf-8');
    const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/3_bibframe2.json'), 'utf-8'));
    expect(
      await formats[MARC_MEDIA_TYPE].to[JSONLD_MEDIA_TYPE](IN),
    ).toEqual(OUT);
  });

  test('jsonld bf2 mapping - 4', async () => {
    expect.assertions(1);
    const IN = fs.readFileSync(path.join(__dirname, 'data/4_marc21.mrc'));
    const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/4_bibframe2.json'), 'utf-8'));
    expect(
      await formats[MARC_MEDIA_TYPE].to[JSONLD_MEDIA_TYPE](IN),
    ).toEqual(OUT);
  });
  test('jsonld bf2 mapping - 6', async () => {
    expect.assertions(1);
    const IN = fs.readFileSync(path.join(__dirname, 'data/6_marc21.mrc'));
    const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/6_bibframe2.json'), 'utf-8'));
    expect(
      await formats[MARC_MEDIA_TYPE].to[JSONLD_MEDIA_TYPE](IN),
    ).toEqual(OUT);
  });

  test('MARC21 to BibFrame2', async () => {
    expect.assertions(2);
    const bf2Xml = (await formats[MARC_MEDIA_TYPE].to[JSONLD_MEDIA_TYPE](
      fs.readFileSync(path.join(__dirname, 'history_xvii/RuMoRGB/01002988236_marc21.mrc'), 'utf-8'),
    ));
    expect(
      bf2Xml,
    ).toEqual(
      // fs.readFileSync(path.join(__dirname, '01002988236_marc21.bf2.xml'), 'utf-8')
      fs.readFileSync(path.join(__dirname, '01002988236_marc21.bf2.jsonld.json'), 'utf-8'),
    );

  });
});
