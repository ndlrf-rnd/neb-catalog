const { warn } = require('../../../utils');
const { cpMap } = require('../../../utils');
const { countResourceChildren } = require('./resource');
const { refreshDbStats } = require('../../../dao/dao');
const { describeDbEntities } = require('../../../dao/db-lifecycle');
const { getDb } = require('../../../dao/db-lifecycle');
const { authenticateBySecret } = require('../../../dao/account');
const { sendResponse } = require('../formatResponse');

const deleteResources = async (req, res) => {
  const resChunks = (`${req.url}`.split('?')[0].split('/resources/')[1] || '').split(/\//ug);
  const secret = req.body.secret;
  const account = req.body.account;
  if (resChunks.length === 0) {
    if (!req.params.kind) {
      return sendResponse(
        403, req, res,
        new Error(`[CATALOG:DELETE] ERROR: please, define at least resource kind to delete`),
      );
    }
  }
  const kind = resChunks[0];
  const source = resChunks[1];
  const key = resChunks[2];
  warn(`[CATALOG:DELETE:${process.pid}] Deleting resources ${kind}/ ${source || '*'}/${key || '*'}`);
  if (!secret) {
    return sendResponse(
      403, req, res,
      new Error(`[CATALOG:DELETE] You are not authorized to delete resources, it is possible only with power user privileges`),
    );
  }
  const auth = await authenticateBySecret({
    secret,
    email: account,
  });
  if (auth.power !== true) {
    return sendResponse(
      403, req, res,

      new Error(`[CATALOG:DELETE] You are not authorized to delete resources, it is possible only with power user privileges`));
  } else {
    const db = await getDb();
    const dbEntities = await describeDbEntities();
    if ((!dbEntities[kind]) || (!dbEntities[kind].details.table)) {
      const e = new Error(`[CATALOG:DELETE] Entity kind "${kind}" not found`);
      e.possibleOptions = Object.keys(dbEntities).sort();
      return sendResponse(404, req, res, e);
    }
    const incoming = Object.values(dbEntities[kind].incoming || {}).map(({ table }) => table);
    const outgoing = Object.values(dbEntities[kind].outgoing || {}).map(({ table }) => table);
    try {
      const stats = await countResourceChildren(kind, source, key);
      const qs = [
        ...incoming.map(table => `DELETE FROM ${table} ${source ? `WHERE source_to=$<source> ${key ? `AND key_to=$<key>` : ''}` : 'WHERE TRUE'}`),
        ...outgoing.map(table => `DELETE FROM ${table} ${source ? `WHERE source_from=$<source> ${key ? `AND key_from=$<key>` : ''}` : 'WHERE TRUE'}`),
        `DELETE FROM ${dbEntities[kind].details.table} ${source ? `WHERE source=$<source> ${key ? `AND key=$<key>` : ''}` : 'WHERE TRUE'}`,
        `DELETE FROM ${dbEntities[kind].table} ${source ? `WHERE source=$<source> ${key ? `AND key=$<key>` : ''}` : 'WHERE TRUE'}`,
      ].map(s => `${s.replace(/;[\r\n\t ]*$/uig, '')};`);
      const deletedCount = await cpMap(
        qs,
        async query => {
          process.stderr.write(`[CATALOG:DELETE] ${query}`);
          const opTimeStartSec = (new Date()).getTime() / 1000;
          const vars = {
            source,
            key,
          };
          const deletedCount = await db.result(
            query,
            vars,
            r => r.rowCount,
          );
          const opTimeSec = ((new Date()).getTime() / 1000 - opTimeStartSec);
          process.stderr.write(`    -- ${deletedCount} tuples deleted in ${opTimeSec.toFixed(3)} seconds\n`);
          return {
            vars,
            deletedCount,
            query: query,
            executionTimeSec: opTimeSec,
          };
        },
      );
      await refreshDbStats();
      return sendResponse(200, req, res, {
        stats,
        deletedCount,
      });
    } catch (e) {
      return sendResponse(500, req, res, e);
    }
  }
};

module.exports = {
  deleteResources,
};


