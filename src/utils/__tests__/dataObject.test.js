const fs = require('fs');
const path = require('path');
const { jsonParseSafe } = require('../json');

const { sanitizeDataObject } = require('..');

const IO = [
  {
    input: jsonParseSafe(fs.readFileSync(path.join(__dirname, 'dataObject.input.json'), 'utf-8')),
    output: jsonParseSafe(fs.readFileSync(path.join(__dirname, 'dataObject.output.json'), 'utf-8')),
  },
];

test('sanitizeDataObject - knpam test', () => {
  expect(sanitizeDataObject(IO[0].input)).toEqual(IO[0].output);
});
