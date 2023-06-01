const { getDb, describeTables } = require('../db-lifecycle');

test('describe tables', async () => {
  expect.assertions(5)
  const res = await describeTables();
  expect(res.relations.length).toBeGreaterThan(0);
  expect(res.relations.map(x => x.kinds.length)).toEqual(res.relations.map(() => 2));
  expect(res.details.length).toBeGreaterThan(0);
  expect(res.anchors.length).toBeGreaterThan(0);
  expect(res.service.length).toEqual(4);
});
