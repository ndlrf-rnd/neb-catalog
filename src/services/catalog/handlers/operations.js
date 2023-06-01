const { OPDS2_CONFIG } = require('../../../constants');
const { ORDER_ASC } = require('../../../constants');
const { getDb } = require('../../../dao/db-lifecycle');
const { LRO_OPERATIONS_TABLE_NAME } = require('../../lro');
const { genNavigationGroup } = require('../groups/navigationGroup');
const { ___ } = require('../../../i18n/i18n');
const { warn, error, info, debug } = require('../../../utils');
const { listOperationTypes } = require('../../lro');
const { sendResponse } = require('../formatResponse');
const { DEFAULT_LIST_OPERATIONS_LIMIT } = require('../../lro/constants');
const { forceArray } = require('../../../utils');
const { authenticateBySecret } = require('../../../dao/account');
const { getQueue, listOperations } = require('../../lro');

const getOperations = async (req, res) => {
  if (forceArray(req.ctx.authorizedFor).length > 0) {
    const limit = Math.max(
      1,
      (req.query.limit
          ? parseInt(req.query.limit, 10)
          : 0
      ) || DEFAULT_LIST_OPERATIONS_LIMIT,
    );
    const id = parseInt(`${req.ctx.url.pathname.split(/\/operations\//uig)[1] || ''}`, 10);
    const operationsList = await listOperations(
      {
        id,
        order: req.ctx.order,
        after: req.ctx.afterSerial ? req.ctx.afterSerial[1] : null,
        limit: limit,
        power: req.ctx.power,
        accounts: [req.ctx.account],
      },
    );
    if (id && (operationsList.length === 0)) {
      sendResponse(404, req, res, new Error(`Operation with ID ${id} not found`));
    } else {
      const identifier = id ? `${req.ctx.baseUri}/operations/${id}` : `${req.ctx.baseUri}/operations/`;
      const numberOfItems = parseInt(
        (
          await (await getDb()).one(
            `SELECT COUNT(*) FROM ${LRO_OPERATIONS_TABLE_NAME} AS count;`,
          )
        ).count,
        10,
      );
      sendResponse(200, req, res, {
        '@context': {
          'hydra': 'http://www.w3.org/ns/hydra/context.jsonld',
          'schema': 'http://schema.org/',
        },
        metadata: {
          title: id ? ___(`Operation {{id}}`, { id }) : ___('Operations'),
          numberOfItems,
          numberOfPageItems: operationsList.length,
          itemsPerPage: req.ctx.limit,
          identifier,
          '@id': identifier,
          '@type': [
            'Collection',
            'Operation',
          ],
          order: req.ctx.order,
        },
        links: operationsList,
        navigation: await genNavigationGroup(operationsList, {
          ...req.ctx,
          kind: 'operation',
        }),
      });
    }
  } else {
    const err = new Error('[LRO:MASTER] You are not authorized to see operations, please, provide "secret" querystring param');
    err.possibleOptions = 'https://catalog.rusneb.ru/operations.json?secret=42ac570f4cedb9b8ce7711a2c763b04e';
    sendResponse(403, req, res, err);
  }
};

const postScheduleOperation = async (req, res) => {
  // eslint-disable-next-line no-unused-vars
  if (forceArray(req.ctx.authorizedFor).length > 0) {
    const type = req.body.type;
    debug(`[LRO:MASTER:${process.pid}:${type}] Initiated "${type}" operation.`);
    if (req.body.provider) {
      warn(`[LRO:MASTER:${process.pid}:${type}] Explicitly defined Data provider: "${req.body.provider}"`);
    }
    if (listOperationTypes().indexOf(type) !== -1) {
      const q = await getQueue(false);
      const task = await q.send({
        type,
        parameters: { provider: req.ctx.authorizedFor[0], ...(req.body.parameters || {}) },
        account: decodeURIComponent(req.ctx.account || req.ctx.email),
        provider: req.ctx.authorizedFor[0],
        documents_estimated: (req.ctx.limit && (req.ctx.limit > 0)) ? req.ctx.limit : null,
      });
      sendResponse(200, req, res, task.operation);
    } else {
      sendResponse(402, req, res, new Error(`[LRO:MASTER:${process.pid}] Invalid operation type: "${type}"`));
    }
  } else {
    sendResponse(403, req, res, new Error(`[LRO:MASTER] You are not authorized to see operations because you provided invalid or not existing secret token`));
  }
};

const deleteCancelOperation = async (req, res) => {
  const url = new URL(req.url, OPDS2_CONFIG.baseUri);
  const opId = parseInt(url.pathname.split('/').filter(v => !!v).slice(-1)[0], 10);
  const secret = req.query.secret;
  const account = req.query.account;
  if (!secret) {
    sendResponse(403, req, res, {
      error: `[LRO:MASTER] You are not authorized to cancel operation ${opId}, please, provide "secret" querystring param`,
    });
  } else {
    // eslint-disable-next-line no-unused-vars
    const { providers } = await authenticateBySecret({
      secret,
      email: account,
    });

    if (providers.length > 0) {
      warn(`[LRO:MASTER:${process.pid}:${opId}] Cancelling operation`);
      const q = await getQueue(false);
      const task = await q.cancel(opId, account);
      warn(`[LRO:MASTER:${process.pid}:${opId}] Operation cancelled`);
      return sendResponse(200, req, res, task);
    } else {
      return sendResponse(403, req, res, {
        error: `[LRO:MASTER:${opId}] You are not authorized to restart operations because you provided invalid or not existing secret token`,
      });
    }
  }
};


module.exports = {
  getOperations: getOperations,
  deleteCancelOperation,
  postScheduleOperation,
};

