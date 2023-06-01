const { OPDS2_CONFIG } = require('../../../constants');
const { ___ } = require('../../../i18n/i18n');
const { sendResponse } = require('../formatResponse');
const { describeDbEntities, getDb } = require('../../../dao/db-lifecycle');
const { tsToPg, debug } = require('../../../utils');

const getStats = async (req, res) => {
  debug('[GET] /stats - get SEED entities statistics');
  const until = req.ctx.until || Math.floor((new Date()).getTime() / 1000);
  const since = req.ctx.since || 0;
  const statCountThreshold = req.ctx.statCountThreshold ? parseInt(req.ctx.statCountThreshold, 10) : OPDS2_CONFIG.statCountThreshold;

  const items = [];
  const db = await getDb();

  const entitiesAndRels = await describeDbEntities();
  const entityTables = Object.values(entitiesAndRels).map(
    ({ stat: { table } }) => table,
  ).sort();
  if (entityTables.length > 0) {
    const detailsStatQ = `
    WITH counts AS (${
      entityTables.map(
        (tableName) => `
        SELECT 
          sum(count) as count,
          source, 
          provider,
          '${tableName}' AS tablename
        FROM ${tableName}
        WHERE 
         (since >= $<since>)
           AND
         (since <= $<until>)
        GROUP BY source, provider
    `).join(' UNION ALL ')
    }) 
      SELECT * FROM counts
      WHERE (count >= $<statCountThreshold>)
    ;`;

    const detailsStat = await db.many(
      detailsStatQ,
      {
        statCountThreshold,
        since: tsToPg(since),
        until: tsToPg(until),
      },
    );
    detailsStat.forEach(
      ({ provider, tablename, source, count }) => items.push({
        source,
        provider,
        type: 'entity',
        count: parseInt(count, 10),
        kind: tablename.replace(/^_[a-z]{1,2}__/, ''),
        ...(req.ctx.timeRangeInStat ? {
          since,
          until,
        } : {}),
      }),
    );
  }
  const relStatsTables = Object.values(entitiesAndRels || {}).reduce(
    (a, o) => ([
      ...a,
      ...Object.values(o.outgoing || {}).filter(
        ({ stat }) => stat,
      ).map(
        ({ stat: { table } }) => table,
      ),
    ]),
    [],
  ).sort();
  if (relStatsTables.length > 0) {
    const relStatsQ = `
    WITH counts AS (${
      relStatsTables.map(
        (tableName) => `
        SELECT 
          sum(count) as count,
          source_from,
          source_to,
          provider,
          '${tableName}' AS tablename
        FROM ${tableName}
        WHERE 
         (since >= $<since>)
           AND
         (since <= $<until>)
        GROUP BY source_from, source_to, provider
    `).join(' UNION ALL ')
    }) 
      SELECT * FROM counts
      WHERE (count >= $<statCountThreshold>)
    ;`;

    const relStats = await db.many(
      relStatsQ,
      {
        statCountThreshold,
        since: tsToPg(since),
        until: tsToPg(until),
      },
    );

    relStats.forEach(
      ({ provider, tablename, source_from, source_to, count }) => items.push({
        source_from,
        source_to,
        provider,
        count: parseInt(count, 10),
        type: 'relation',
        kind_from: tablename.replace(/^_[a-z]{1,2}__/, '').split('__')[0],
        kind_to: tablename.replace(/^_[a-z]{1,2}__/, '').split('__')[1],
        ...(req.ctx.timeRangeInStat ? {
          since,
          until,
        } : {}),
      }),
    );

  }
  const resData = {
    metadata: {
      title: ___('Statistics'),
      distinctEntities: items.filter(({ source }) => !!source).length,
      distinctRelations: items.filter(({ source }) => !source).length,
      numberOfItems: items.filter(({ source }) => !!source).reduce((a, b) => a + b.count, 0),
      numberOfRelations: items.filter(({ source }) => !source).reduce((a, b) => a + b.count, 0),
      ...(req.ctx.timeRangeInStat ? {
        since,
        until,
      } : {}),
      statCountThreshold,
    },
    items: items,
  };
  sendResponse(200, req, res, resData);
};

module.exports = {
  getStats,
};
