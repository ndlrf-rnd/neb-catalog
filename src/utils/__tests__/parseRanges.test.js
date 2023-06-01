const { parseRanges } = require('../parseRanges');

test('parseRanges - no value', () => {
  expect(parseRanges(
    '',
  )).toEqual([]);
});

test('parseRanges - zero', () => {
  expect(parseRanges(
    '0',
  ))
    .toEqual([
      {
        from: 0,
        to: 0,
      },
    ]);
});

test('parseRanges - positive value', () => {
  expect(parseRanges(
    '5',
  ))
    .toEqual([
      {
          from: 5,
        to: 5,
      },
    ]);
});
test('parseRanges - negative value', () => {
  expect(parseRanges(
    '-5',
  ))
    .toEqual([]);
  expect(parseRanges(
    '-10', 10,
  ))
    .toEqual([
      {
        from: 1,
        to: 1,
      },
    ]);
  expect(parseRanges(
    '-5', 10,
  ))
    .toEqual([
      {
        from: 6,
        to: 6,
      },
    ]);
});

test('parseRanges - positive-positive', () => {
  expect(parseRanges(
    '5-10',
  ))
    .toEqual([
      {
        from: 5,
        to: 10,
      },
    ]);
  expect(parseRanges(
    '10-5',
  ))
    .toEqual([
      {
        from: 5,
        to: 10,
      },
    ]);
  expect(parseRanges(
    '5..10',
  ))
    .toEqual([
      {
        from: 5,
        to: 10,
      },
    ]);
  expect(parseRanges(
    '10..5',
  ))
    .toEqual([
      {
        from: 5,
        to: 10,
      },
    ]);
});
test('parseRanges - zero-zero', () => {
  expect(parseRanges(
    '0-0',
  ))
    .toEqual([
      {
        from: 0,
        to: 0,
      },
    ]);
  expect(parseRanges(
    '-0--0',
  ))
    .toEqual([
      {
        from: 0,
        to: 0,
      },
    ]);
});
test('parseRanges - negative-negative', () => {
  expect(parseRanges(
    '-10--5',
  ))
    .toEqual([]);
  expect(parseRanges(
    '-5--10',
  ))
    .toEqual([]);
  expect(parseRanges(
    '-10--5', 20,
  ))
    .toEqual([
      {
        from: 11,
        to: 16,
      },
    ]);
  expect(parseRanges(
    '-6--11', 20,
  ))
    .toEqual([
      {
        from: 10,
        to: 15,
      },
    ]);
});

test('parseRanges - negative-positive', () => {
  expect(parseRanges(
    '-10-5',
  ))
    .toEqual([
      {
        from: 0,
        to: 5,
      },
    ]);
  expect(parseRanges(
    '5--10',
  ))
    .toEqual([
      {
        from: 0,
        to: 5,
      },
    ]);
  expect(parseRanges(
    '-10-5', 20,
  ))
    .toEqual([
      {
        from: 0,
        to: 5,
      },
      {
        from: 11,
        to: 20,
      },
    ]);
  expect(parseRanges(
    '5--10', 20,
  ))
    .toEqual([
      {
        from: 0,
        to: 5,
      },
      {
        from: 11,
        to: 20,
      },
    ]);
});

test('parseRanges - no total', () => {
  expect(parseRanges(
    '4,6,8-10,12,14..16,18,20..23,-11,-11--2',
  )).toEqual([
    {
      from: 4,
      to: 4,
    },
    {
      from: 6,
      to: 6,
    },
    {
      from: 8,
      to: 10,
    },
    {
      from: 12,
      to: 12,
    },
    {
      from: 14,
      to: 16,
    },
    {
      from: 18,
      to: 18,
    },
    {
      from: 20,
      to: 23,
    },
  ]);
});

test('parseRanges - with total', () => {
  expect(parseRanges(
    '4,6,8-10,12,14..16,18,20..23,-11,-2--5,-7--9,-20',
    100,
  )).toEqual([
    {
      from: 4,
      to: 4,
    },
    {
      from: 6,
      to: 6,
    },
    {
      from: 8,
      to: 10,
    },
    {
      from: 12,
      to: 12,
    },
    {
      from: 14,
      to: 16,
    },
    {
      from: 18,
      to: 18,
    },
    {
      from: 20,
      to: 23,
    },
    {
      from: 81,
      to: 81,
    },
    {
      from: 90,
      to: 90,
    },
    {
      from: 92,
      to: 94,
    },
    {
      from: 96,
      to: 99,
    },
  ]);
});

test('parseRanges - default range with step', () => {
  expect(parseRanges(
    '',
    30,
    7,
  )).toEqual([
    {
      from: 1,
      to: 7,
    },
    {
      from: 8,
      to: 14,
    },
    {
      from: 15,
      to: 21,
    },
    {
      from: 22,
      to: 28,
    },
    {
      from: 29,
      to: 30,
    },
  ]);
});

test('parseRanges - with max step', () => {
  expect(parseRanges(
    '0-5,10-20,-5-10,-30-20,30..35,30,-30',
    100,
    3,
  )).toEqual([
    {
      from: 0,
      to: 2,
    },
    {
      from: 3,
      to: 5,
    },
    {
      from: 6,
      to: 8,
    },
    {
      from: 9,
      to: 11,
    },
    {
      from: 12,
      to: 14,
    },
    {
      from: 15,
      to: 17,
    },
    {
      from: 18,
      to: 20,
    },
    {
      from: 30,
      to: 32,
    },
    {
      from: 33,
      to: 35,
    },
    {
      from: 71,
      to: 73,
    },
    {
      from: 74,
      to: 76,
    },
    {
      from: 77,
      to: 79,
    },
    {
      from: 80,
      to: 82,
    },
    {
      from: 83,
      to: 85,
    },
    {
      from: 86,
      to: 88,
    },
    {
      from: 89,
      to: 91,
    },
    {
      from: 92,
      to: 94,
    },
    {
      from: 95,
      to: 97,
    },
    {
      from: 98,
      to: 100,
    },
  ]);
});
