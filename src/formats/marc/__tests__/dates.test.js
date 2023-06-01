const fs = require('fs');
const path = require('path');
const { parseDateStr, getMarcRecordDates } = require('../dates');

test('get marc record dates', () => {
  const jsonEntity = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, 'data', 'dates_1_marc21.json'),
      'utf-8',
    ),
  );
  expect(
    getMarcRecordDates(jsonEntity),
  ).toEqual(
    {
      marcRecordType: 'BIBLIOGRAPHIC',
      entity: 'instance',
      typeOfRange: 'л',
      recordDateStart: new Date('2018-09-14T15:34:23.000Z'),
      recordDateUpdated: new Date('2018-09-14T15:34:23.000Z'),
    },
  );
});


test('get rusmarc record dates', () => {
  const jsonEntity = {
    leader: '01796nam2 22002291i 450 ',
    controlfield: [
      {
        tag: '001',
        value: '009674037',
      },
      {
        tag: '005',
        value: '20191007133100.0',
      },
    ]
    ,
    datafield: [],
  };
  expect(
    getMarcRecordDates(jsonEntity),
  ).toEqual(
    {
      marcRecordType: 'BIBLIOGRAPHIC',
      entity: 'instance',
      recordDateStart: new Date('2019-10-07T13:31:00.000Z'),
      recordDateUpdated: new Date('2019-10-07T13:31:00.000Z'),
    },
  );
});

test('get full marc record dates', () => {
  const jsonEntity = {
    'leader': '01329nam a22003011i 4500',
    'controlfield': [{
      'tag': '001',
      'value': '003335312',
    }, {
      'tag': '005',
      'value': '20190923121254.0',
    }, {
      'tag': '008',
      'value': '071101s1779    ru ||||f |||||||0|||rus d',
    }],
    'datafield': [{
      'tag': '017',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': '2385 - 77',
      }, {
        'code': 'b',
        'value': 'RuMoRGB',
      }],
    }, {
      'tag': '035',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'RU\\NLR\\A1\\12108',
      }],
    }, {
      'tag': '040',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'RuMoRGB',
      }, {
        'code': 'b',
        'value': 'ru',
      }, {
        'code': 'c',
        'value': 'RuSpRNB',
      }, {
        'code': 'd',
        'value': 'RuMoRGB',
      }, {
        'code': 'e',
        'value': 'rcr',
      }],
    }, {
      'tag': '041',
      'ind1': '1',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'rus',
      }, {
        'code': 'h',
        'value': 'fre',
      }],
    }, {
      'tag': '044',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'ru',
      }],
    }, {
      'tag': '100',
      'ind1': '1',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'Вольтер, Франсуа Мари Аруэ де',
      }, {
        'code': 'd',
        'value': '1694-1778',
      }],
    }, {
      'tag': '245',
      'ind1': '0',
      'ind2': '0',
      'subfield': [{
        'code': 'a',
        'value': 'Тактика.',
      }, {
        'code': 'c',
        'value': 'Сочинение г. Волтера, ; Которое преложил в российские стихи Имп. Московскаго университета баккалавр Ермил Костров. Ноября 12 дня 1779 года',
      }],
    }, {
      'tag': '260',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'Москва',
      }, {
        'code': 'b',
        'value': 'Унив. тип., [у Н. Новикова',
      }, {
        'code': 'c',
        'value': '1779]',
      }],
    }, {
      'tag': '300',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': '12 с.',
      }, {
        'code': 'c',
        'value': '8°',
      }],
    }, {
      'tag': '510',
      'ind1': '4',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'СК XVIII',
      }, {
        'code': 'c',
        'value': '№ 1145',
      }],
    }, {
      'tag': '533',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'Имеется электронная копия',
      }],
    }, {
      'tag': '700',
      'ind1': '1',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'Костров, Ермил Иванович',
      }, {
        'code': 'd',
        'value': '1755-1796',
      }, {
        'code': '4',
        'value': 'trl',
      }, {
        'code': 'e',
        'value': 'переводчик',
      }],
    }, {
      'tag': '710',
      'ind1': '2',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'Московский университет',
      }, {
        'code': 'b',
        'value': 'Типография',
      }],
    }, {
      'tag': '852',
      'ind1': '4',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'РГБ',
      }, {
        'code': 'b',
        'value': 'MK',
      }, {
        'code': 'j',
        'value': 'МК Н-8° / 79-В',
      }, {
        'code': 'x',
        'value': '81',
      }],
    }, {
      'tag': '856',
      'ind1': '4',
      'ind2': '1',
      'subfield': [{
        'code': 'q',
        'value': 'application/pdf',
      }, {
        'code': 'u',
        'value': 'http://dlib.rsl.ru/rsl01003000000/rsl01003335000/rsl01003335312/rsl01003335312.pdf',
      }],
    }, {
      'tag': '979',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'dlopen',
      }],
    }, {
      'tag': '979',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'dlrare',
      }],
    }, {
      'tag': '979',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'mk18vrus',
      }],
    }, {
      'tag': '979',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'knpam',
      }],
    }, {
      'tag': '979',
      'ind1': '#',
      'ind2': '#',
      'subfield': [{
        'code': 'a',
        'value': 'kpcivil',
      }],
    }],
  };
  expect(
    getMarcRecordDates(jsonEntity),
  ).toEqual(
    {
      marcRecordType: 'BIBLIOGRAPHIC',
      entity: 'instance',
      dateStart: new Date('1779-01-01T00:00:00.000Z'),
      recordDateStart: new Date('2007-11-01T00:00:00.000Z'),
      recordDateUpdated: new Date('2019-09-23T12:12:54.000Z'),
      typeOfRange: 's',
    },
  );
});

test('date conversion', () => {
  expect(
    parseDateStr('19940223151047.0'),
  ).toEqual(
    new Date('1994-02-23T15:10:47.000Z'),
  );
  expect(
    parseDateStr('20190805170958.0'),
  ).toEqual(
    new Date('2019-08-05T17:09:58.000Z'),
  );
});
