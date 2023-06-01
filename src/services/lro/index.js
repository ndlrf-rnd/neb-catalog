/**
 * @module Long-Rcunning Operations engine
 */
const cluster = require('cluster');
const {
  LRO_OPERATION_MAX_SILENCE_TIME_SEC,
  BACKGROUND_IDLE_CHECKER_INTERVAL_MS,
} = require('./constants');
const { ORDER_DESC } = require('../../constants');
const { pick } = require('../../utils');

const {
  info,
  warn,
  jsonStringifySafe,
  pickBy,
  isEmpty,
  get,
  omit,
  cpMap,
  error,
  parseTsRange,
  forceArray,
  defaults,
} = require('../../utils');

const { getDb } = require('../../dao/db-lifecycle');
const debug = process.env.DEBUG
  ? (v) => process.stdout.write(`${typeof v === 'string' ? v : JSON.stringify(v)}\n`)
  : (v) => v;

const {
  LRO_QUEUE_CHANNEL,
  LRO_OPERATIONS_TABLE_NAME,
  LRO_OPERATION_DEFAULT_TYPE,
  LRO_OPERATION_STATE,
  LRO_ORDER,
  DEFAULT_LIST_OPERATIONS_LIMIT,
  LRO_DEFAULT_LIST_OPERATIONS_ORDER,
  LRO_SQL_TYPE,
} = require('./constants');


const OPERATION_PROTECTED_PROPS = ['id', 'type', 'state', 'parameters', 'output', 'running_time'];


// const LRO_QUEUE_DEFAULT_MAX_ATTEMPTS = 13;
const LRO_QUEUE_DEFAULT_MAX_ATTEMPTS = 1;
const LRO_QUEUE_DEFAULT_DELAY_MS = 3000;

global.OPERATION_ID = null;
global.LOCAL_RESULT_SUBSCRIBERS = {};
global.INTERFACE = null;
global.IS_WORKER = false;

global.OPERATIONS_REGISTRY = {
  [LRO_OPERATION_DEFAULT_TYPE]: async () => {
    debug(`Executed ${LRO_OPERATION_DEFAULT_TYPE}`);
  },
};
let basicLogHeader = `[LRO:INITIALIZING:${process.pid}]`;
const onError = err => {
  error(err);
  throw err;
};

const registerOperation = (operationType, fn, force = true) => {
  const alreadyRegistered = typeof global.OPERATIONS_REGISTRY[operationType] !== 'undefined';
  if (alreadyRegistered) {

    debug(`[LRO:${process.pid}] Operation type "${operationType}" is already registered`);
    if (force) {
      global.OPERATIONS_REGISTRY[operationType] = fn;
      debug(`[LRO:${process.pid}] Overriding previous handler due force=true for registration function.`);
    } else {
      debug(`[LRO:${process.pid}] ignoring overriding registration`);
    }
  } else {
    global.OPERATIONS_REGISTRY[operationType] = fn;
    if (process.env.LRO_DEBUG) {
      debug(`[LRO:${process.pid}] Operation "${operationType}" registered.`);
    }
  }
};
const listOperationTypes = () => Object.keys(global.OPERATIONS_REGISTRY).sort();

/**
 * Update operation debugrmation
 * @param connection
 * @param id
 * @param args {
 *   state: {LRO_OPERATION_STATE_type}
 *   parameters: {str: list|dict},
 *   documents_estimated: {?number},
 *   documents_completed: {?number},
 *   bytes_estimated: {?number},
 *   bytes_completed: {?number},
 *   output: {obj},
 * }
 * @returns {Promise<*>}
 */

const updateOperation = async (connection, id, args) => {
  const {
    state,
    parameters,
    documents_estimated,
    documents_completed,
    bytes_estimated,
    bytes_completed,
    account,
    retry,
    output,
  } = args;
  info(`[LRO:${process.pid}] Updating operation ${id}, defining new parameters: ${JSON.stringify(args)}`);
  return id
    ? connection.oneOrNone(
      `UPDATE ${LRO_OPERATIONS_TABLE_NAME} 
    SET 
      -- IMPORTANT:
      --    ::  - pg typecasting
      --    :   - pg-promise typecasting

      ${LRO_OPERATION_STATE[state] ? `state = $<state>::${LRO_SQL_TYPE},` : ''}
      ${(typeof parameters !== 'undefined') ? 'parameters = $<parameters>::JSONB,' : ''}

      ${(typeof documents_estimated !== 'undefined') ? 'documents_estimated = $<documents_estimated>::BIGINT,' : ''}
      ${(typeof documents_completed !== 'undefined') ? 'documents_completed = $<documents_completed>::BIGINT,' : ''}
      ${(typeof bytes_estimated !== 'undefined') ? 'bytes_estimated = $<bytes_estimated>::BIGINT,' : ''}
      ${(typeof bytes_completed !== 'undefined') ? 'bytes_completed = $<bytes_completed>::BIGINT,' : ''}
      ${(typeof account !== 'undefined') ? 'account = $<account>,' : ''}
      ${(typeof retry !== 'undefined') ? 'retries = retries + 1, worker_pid = NULL,' : ''}
      
      ${(typeof output !== 'undefined') ? `output = $<output:json>::JSONB,` : ''} 
      running_time = TSTZRANGE(
        LOWER(running_time),
        CURRENT_TIMESTAMP 
      )
    WHERE id = (
      SELECT id
      FROM ${LRO_OPERATIONS_TABLE_NAME}
      WHERE id = \${id}
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING * ;`,
      {
        ...args,
        ...(parameters ? { parameters: JSON.parse(jsonStringifySafe(parameters)) } : {}),
        ...(output ? { output: JSON.parse(jsonStringifySafe(output)) } : {}),
        id,
      },
    )
    : null;
};


const _takeOperation = async () => {
  if (!global.IS_WORKER) {
    info(`${basicLogHeader} Not taking task by non-worker process`);
    return null;
  } else if (global.OPERATION_ID) {
    info(`[LRO:WORKER:${process.pid}:${global.OPERATION_ID}] Not taking task due operation ${global.OPERATION_ID} being currently executed`);
    return null;
  }
  const connection = global.INTERFACE.connection;
  const operation = await connection.oneOrNone(`
  UPDATE ${LRO_OPERATIONS_TABLE_NAME} 
  SET 
    state = $<processing>,
    worker_pid = $<pid>,
    running_time = TSTZRANGE(CURRENT_TIMESTAMP, NULL)
  WHERE id = (
      SELECT id
      FROM ${LRO_OPERATIONS_TABLE_NAME}
      WHERE (
        state=$<pending>
      ) OR (
        (
          state=$<processing>
        ) AND (
          (
            EXTRACT(epoch FROM CURRENT_TIMESTAMP) 
            -
            EXTRACT(epoch FROM UPPER(running_time))
          ) > $<maxSilenceSec>
        )
      )
      ORDER BY id ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
  )
  RETURNING *;`,
    {
      failed: LRO_OPERATION_STATE.FAILED,
      successful: LRO_OPERATION_STATE.SUCCESSFUL,
      pending: LRO_OPERATION_STATE.PENDING,
      processing: LRO_OPERATION_STATE.PROCESSING,
      finalizing: LRO_OPERATION_STATE.FINALIZING,
      maxSilenceSec: LRO_OPERATION_MAX_SILENCE_TIME_SEC,
      pid: process.pid,
    },
  );
  let logPrefix = basicLogHeader;
  if (operation) {
    global.OPERATION_ID = parseInt(operation.id, 10);
    logPrefix = `[LRO:${global.IS_WORKER ? 'WORKER' : 'CLIENT'}:${process.pid}:${[operation.type, operation.id, operation.state].join(':')}]`;
    const operationFn = global.OPERATIONS_REGISTRY[operation.type];
    if (!operationFn) {
      info(`${logPrefix} FAILED due invalid operation type, registered types are: ${JSON.stringify(Object.keys(global.OPERATIONS_REGISTRY).sort())}`);
    } else {
      info(`${logPrefix} Operation picked up by worker`);
      const operationId = operation.id;
      let res;
      try {
        const output = await operationFn(
          operation.parameters,
          async (args) => {
            const restrictedFound = args && OPERATION_PROTECTED_PROPS.reduce(
              (a, o) => a || (typeof args[o] !== 'undefined'),
              false,
            );
            if (restrictedFound) {
              process.stderr.write([
                logPrefix,
                `WARNING for Operation with ID=${operationId}`,
                `You can't set ${OPERATION_PROTECTED_PROPS.map(v => `"${v}"`).join(', ')} properties from inside of running task.`,
                `This properties will be ignored.`,
              ].map(l => `${l}\n`).join(''));
              args = omit(args, OPERATION_PROTECTED_PROPS);
            }
            await updateOperation(
              connection,
              operationId,
              {
                ...args,
                retries: args.retries + 1,
              },
            );
          },
          operation,
        );

        res = await updateOperation(
          connection,
          operationId,
          {
            output,
            state: LRO_OPERATION_STATE.SUCCESSFUL,
          },
        );

        if (process.env.LRO_DEBUG) {
          debug(`${logPrefix} Operation finished.`);
        }
      } catch (e) {
        error(`${logPrefix} FAILED during execution with message: "${e.message}"\n${e.stack}`);
        global.OPERATION_ID = null;
        try {
          res = await updateOperation(
            connection,
            operationId,
            {
              state: LRO_OPERATION_STATE.FAILED,
              output: {
                error: e.message || `${e}`,
              },
            },
          );
        } catch (ef) {
          process.stderr.write(`${logPrefix} ERROR: Can't finalize failed operation state: ${ef.message}\n${ef.stack}\n`);
        }
      }
      process.stderr.write(`${logPrefix} Worker resource is released and now worker will check for next operation to handle...\n`);
      return res;
    }
  }
};
/**
 * Add listeners to pg connection.
 * @param connection
 * @param onNotification
 * @returns {Promise<null>}
 */
const setListeners = async (connection, onNotification) => {
  connection.client.on('notification', onNotification);
  const listener = await connection.none(`LISTEN ${LRO_QUEUE_CHANNEL}`);
  debug(`${basicLogHeader} Now listening DB bus.`);
  return listener;
};

const sanitizeParameters = (parameters) => pickBy(
  parameters || {},
  (v, k) => (!isEmpty(v)) && (!k.match(/(_|^)secret(_|$)/uig)),
);

const sanitizeDbOperationRecord = (rec) => rec ? [
  'documents_estimated',
  'documents_completed',
  'bytes_estimated',
  'bytes_completed',
].reduce(
  (a, k) => (
    (rec[k] === null) ? a : {
      ...a,
      [k]: parseInt(rec[k], 10),
    }
  ),
  {
    ...rec,
    '@type': 'http://www.w3.org/ns/hydra/core#Operation',
    kind: 'operation',
    parameters: sanitizeParameters(rec.parameters),
    running_time: parseTsRange(rec.running_time),
  },
) : null;

const getOperation = async (connection, operationId) => {
  const res = await connection.one(
    `SELECT * FROM ${LRO_OPERATIONS_TABLE_NAME} 
  WHERE id = \${operationId} 
  ORDER BY LOWER(running_time) LIMIT 1;`,
    { operationId },
  );
  return sanitizeDbOperationRecord(res);
};
const LRO_DEFAULT_LIST_OPTIONS = {
  order: LRO_DEFAULT_LIST_OPERATIONS_ORDER,
  limit: DEFAULT_LIST_OPERATIONS_LIMIT,
  offset: 0,
  filterStates: Object.keys(LRO_OPERATION_STATE).sort(),
};
const listOperations = async (options) => {
  const db = await getDb();
  const o = defaults(options || {}, LRO_DEFAULT_LIST_OPTIONS);

  // const offset = Math.max(0, parseInt(`${o.offset}`, 10) || 0);
  const limit = Math.max(1, parseInt(`${o.limit}`, 10) || DEFAULT_LIST_OPERATIONS_LIMIT);
  const order = (typeof o.order === 'string') && (o.order.toUpperCase() === LRO_ORDER.ASC) ? LRO_ORDER.ASC : LRO_ORDER.DESC;
  const isOrderDesc = order.toLocaleUpperCase() === ORDER_DESC.toLocaleUpperCase();

  const afterCondition = o.after // If explicit keys defined no after filter will be used
    ? ` AND op.id ${isOrderDesc ? '<' : '>'} $<after>`
    : '';
  const whereAcc = o.power ? '' : `WHERE account IN (${o.accounts.map(v => `'${v.replace(/'/ug, `\\\\'`)}'`).join(',')})`;
  const state = await db.manyOrNone(`
    SELECT * FROM ${LRO_OPERATIONS_TABLE_NAME} AS op
    ${whereAcc}
    ${o.id ? ` AND id = $<id>` : ''}
    ${afterCondition}
    ORDER BY op.created_at ${order} 
    LIMIT $<limit>;`,
    {
      limit,
      order,
      ...pick(o, ['id', 'after']),
    },
  );
  return forceArray(state).map(sanitizeDbOperationRecord);
};

const onConnectionLost = async (
  err,
  connection,
  onNotification,
) => {
  warn(`${basicLogHeader} Worker accidentally lost connection to Database and currently not listening for new outputs about operation state change in queue.\n`);
  connection.client.removeListener('notification', onNotification);
  global.INTERFACE = null;
  warn(`${basicLogHeader} Connection Lost Permanently`);
};


/**
 * Say is operation state have finite Success/Error value or not
 * @param state
 * @returns {boolean}
 */
const shouldTakeMoreAfter = state => ([
  LRO_OPERATION_STATE.CANCELLED,
  LRO_OPERATION_STATE.PENDING,
  LRO_OPERATION_STATE.FAILED,
  LRO_OPERATION_STATE.SUCCESSFUL,
].indexOf(state) !== -1);

/**
 * Say is operation state have finite Success/Error value or not
 * @param state
 * @returns {boolean}
 */
const isFinalState = state => ([
  LRO_OPERATION_STATE.CANCELLED,
  LRO_OPERATION_STATE.FAILED,
  LRO_OPERATION_STATE.SUCCESSFUL,
].indexOf(state) !== -1);

/**
 * Get function responsible for outputs handling with prepared context
 * @returns {function(*): Promise<null|*|undefined>}
 */
const getOnNotificationFn = (connection) => async (message) => {
  const outputOperationId = parseInt(message.payload, 10);
  const outputOperation = await getOperation(connection, outputOperationId);
  let waiter = global.LOCAL_RESULT_SUBSCRIBERS[outputOperationId];
  if (!waiter) {
    waiter = { onProgress: [] };
    waiter.promise = new Promise(
      (_resolve, _reject) => {
        waiter.resolve = _resolve;
        waiter.reject = _reject;
      },
    );
    global.LOCAL_RESULT_SUBSCRIBERS[outputOperationId] = waiter;
  }
  if (waiter && waiter.onProgress) {
    const progress = {
      ...omit(outputOperation, ['parameters', 'output']),
      running_time: parseTsRange(outputOperation.running_time),
    };
    await cpMap(waiter.onProgress, async fn => fn(progress));
  }

  // Operation will not change its state in future. Finalize all handlers that might be
  // waiting for task result in current Node runtime
  if (isFinalState(outputOperation.state)) {
    waiter.resolve(outputOperation);
  }
  if (shouldTakeMoreAfter(outputOperation.state) && (global.IS_WORKER) && (!global.OPERATION_ID) && (global.INTERFACE)) {
    return _takeOperation();
  }
};

const wait = (operationId, onProgress) => {
  let waiter = global.LOCAL_RESULT_SUBSCRIBERS[operationId];
  if (!waiter) {
    waiter = { onProgress: [] };
    waiter.promise = new Promise(
      (_resolve, _reject) => {
        waiter.resolve = _resolve;
        waiter.reject = _reject;
      },
    );
    global.LOCAL_RESULT_SUBSCRIBERS[operationId] = waiter;
  }
  if (typeof onProgress === 'function') {
    waiter.onProgress.push(onProgress);
  }
  return waiter.promise;
};

const send = async (connection, { type, account, parameters }) => {
  if (global.OPERATIONS_REGISTRY[type]) {
    info(`[LRO:${process.pid}] ${type} task for ${account}`);
    return sanitizeDbOperationRecord(
      await connection.one(
        `INSERT INTO ${LRO_OPERATIONS_TABLE_NAME}
        (
          type,
          parameters,
          bytes_estimated,
          documents_estimated,
          account,
          retries
        )
      VALUES (
        \${type},
        \${parameters}::JSONB,
        \${bytes_estimated}::BIGINT,
        \${documents_estimated}::BIGINT,
        \${account},
        0
      ) RETURNING *;`,
        {
          type,
          account,
          parameters: sanitizeParameters(parameters),
          bytes_estimated: get(parameters, ['bytes_estimated'], null),
          documents_estimated: get(parameters, ['documents_estimated'], null),
        },
      ),
    );
  } else {
    const em = [
      `Invalid operation type: '${type}'.`,
      `The following registered operation types should be used:`,
      JSON.stringify(Object.keys(global.OPERATIONS_REGISTRY).sort()),
    ].join('\n');
    error(em);
    onError(new Error(em));
  }
};

const connect = () => new Promise(
  (resolve, reject) => {
    let onNotificationFn;
    let onConnectionLostFn;
    if (!global.INTERFACE) {
      info(`${basicLogHeader} Connecting... `);
      getDb().catch(reject).then(
        db => db.connect({
          direct: true,
          onLost: onConnectionLostFn,
        }),
      ).then(
        connection => {
          onNotificationFn = getOnNotificationFn(connection);
          onConnectionLostFn = (err, e) => onConnectionLost(err, e, onNotificationFn);
          setListeners(connection, onNotificationFn).catch(reject).then(
            () => {
              const itf = {
                send: async ({ type, account, ...parameters }) => {
                  const operation = await send(
                    connection,
                    {
                      type,
                      account,
                      ...parameters,
                    },
                  );
                  if (!global.LOCAL_RESULT_SUBSCRIBERS[operation.id]) {
                    global.LOCAL_RESULT_SUBSCRIBERS[operation.id] = { onprogress: [] };
                    global.LOCAL_RESULT_SUBSCRIBERS[operation.id].promise = new Promise((_resolve, _reject) => {
                      global.LOCAL_RESULT_SUBSCRIBERS[operation.id].resolve = _resolve;
                      global.LOCAL_RESULT_SUBSCRIBERS[operation.id].reject = _reject;
                    });
                  }
                  return {
                    operation,
                    promise: global.LOCAL_RESULT_SUBSCRIBERS[operation.id].promise,
                    wait: (onProgress) => wait(operation.id, onProgress),
                  };
                },
                cancel: async (operationId, account) => await updateOperation(
                  connection,
                  operationId,
                  {
                    account,
                    state: LRO_OPERATION_STATE.CANCELLED,
                  },
                ),
                connection: connection,
                stop: (closeConnection = false) => {
                  if (cluster.isMaster) {
                    connection.client.removeListener('notification', onNotificationFn);
                    global.INTERFACE = null;
                    global.IS_WORKER = null;
                    global.OPERATION_ID = null;
                    if (closeConnection) {
                      connection.done();
                    }
                    info(`${basicLogHeader} stopped`);
                  }
                },
                wait,
              };
              info(`${basicLogHeader} Successfully connected`);
              global.INTERFACE = itf;
              resolve(global.INTERFACE);
            },
          );
        },
      );
    } else {
      resolve(global.INTERFACE);
    }
  },
);

/**
 * Run Worker
 *
 * NOTE Fromm [pg-promise doc](https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example):
 * Temporary listener, using the connection pool:
 * listening will stop when the connection pool releases the physical connection,
 * due to inactivity (see newTimeoutMillis) or a connectivity error.
 *
 * @returns {Promise<{listener: null, send: *, stop: *}>}
 */
const getQueue = async (isWorker = false) => {
  if (cluster.isMaster) {
    global.IS_WORKER = global.IS_WORKER || isWorker;
    basicLogHeader = `[LRO:${global.IS_WORKER ? 'WORKER' : 'MASTER'}:${process.pid}]`;
    info(`${basicLogHeader} Initializing queue`);
    const itf = await connect();
    if (global.IS_WORKER) {
      await _takeOperation();
      setInterval(() => _takeOperation(), BACKGROUND_IDLE_CHECKER_INTERVAL_MS);
    }
    return itf;
  } else {
    error(`[LRO:CLUSTER:WORKER] ERROR: Can't instantiate LRO queue from Node.js cluster worker, only master can do this.`)
  }
};

module.exports = {
  getQueue,
  registerOperation,
  listOperations,
  listOperationTypes,
  LRO_OPERATIONS_TABLE_NAME,
  LRO_OPERATION_STATE,
  LRO_QUEUE_CHANNEL,
  LRO_QUEUE_DEFAULT_MAX_ATTEMPTS,
  LRO_QUEUE_DEFAULT_DELAY_MS,
  LRO_DEFAULT_LIST_OPERATIONS_ORDER,
  LRO_ORDER,
};
