const fs = require('fs');
const path = require('path');
const { query } = require('../cypher');

describe('Cypher', () => {
  test('Cypher - merge', async () => {
    expect.assertions(1);
    const resMerge = await query(
      fs.readFileSync(path.join(__dirname, 'query-01-merge.cql'), 'utf-8'),
    );
    expect(resMerge).toEqual(
      JSON.parse(fs.readFileSync(path.join(__dirname, 'query-01-result.json'), 'utf-8').replace(/\r\n/ug, '\n')),
    );
  }, 1000);

  test('Cypher - 3 - MATCH', async () => {
    expect.assertions(1);
    const res = await query(
      fs.readFileSync(path.join(__dirname, 'test-02-query.cql'), 'utf-8'),
    );
    expect(res.join('')).toEqual(
      fs.readFileSync(path.join(__dirname, 'test-02-query.sql'), 'utf-8').replace(/\r\n/ug, '\n'),
    );
  }, 1000);

  test('Cypher - 3 - parser', async () => {
    expect.assertions(1);

    const result = await query(
      fs.readFileSync(path.join(__dirname, 'test-03-query.cql'), 'utf-8'),
    );
    expect(result.join('')).toEqual(
      fs.readFileSync(path.join(__dirname, 'test-03-result.sql'), 'utf-8').replace(/\r\n/ug, '\n')
    );
  }, 1000);

});
