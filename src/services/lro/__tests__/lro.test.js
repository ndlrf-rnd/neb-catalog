const { mapValues } = require('../../../utils');
const { describeDbEntities } = require('../../../dao/db-lifecycle');
const { ENTITY_NAME } = require('../../../dao/queries');
const { getDb } = require('../../../dao/db-lifecycle');
const {
  getQueue,
  registerOperation,
} = require('../index');
const {
  omit,
  sortBy,
  forceArray,
  parseTsRange,
  wait,
} = require('../../../utils/');
const { LRO_OPERATION_STATE } = require('../constants');

const TEST_OPERATIONS_DICT = {
  test_stats: async (task, updateTask) => {
    await updateTask({
      documents_estimated: 13,
      documents_completed: 1,
    });
    const res = mapValues(
      await describeDbEntities(),
      v => Object.keys(v.outgoing || {}).length,
    );
    await updateTask({
      documents_estimated: 13,
      documents_completed: 13,
    });
    return res;
  },
  bad_test: async (task, updateTask) => {
    await updateTask({
      documents_estimated: 7,
      documents_completed: 0,
    });
    await updateTask({
      documents_estimated: 7,
      documents_completed: 6,
    });
    throw new Error('Surprise!');
  },
  test: async (task, updateTask) => {
    await updateTask({
      documents_estimated: 7,
      documents_completed: 0,
    });
    await updateTask({
      documents_estimated: 7,
      documents_completed: 7,
    });
  },
  long_test: async (task, updateTask) => {
    await updateTask({
      documents_estimated: 3,
      documents_completed: 0,
    });
    await wait(500);
    await updateTask({
      documents_estimated: 3,
      documents_completed: 1,
    });
    await wait(500);
    task = await updateTask({
      documents_estimated: 3,
      documents_completed: 2,
    });
    await wait(50);
    return await updateTask({
      documents_estimated: 3,
      documents_completed: 3,
    });
  },
  short_test: async (task, updateTask) => {
    await wait(100);
    await updateTask({
      documents_estimated: 1,
      documents_completed: 0,
    });
    await wait(25);
    return await updateTask({
      documents_estimated: 1,
      documents_completed: 1,
    });
  },
  bad_short_test: async (task, updateTask) => {
    await wait(100);
    await updateTask({
      documents_estimated: 1,
      documents_completed: 0,
    });
    await wait(25);
    throw new Error('Surprise!');
  },
};

beforeEach(() => {
  Object.keys(TEST_OPERATIONS_DICT).map(
    (operationName) =>
      registerOperation(operationName, TEST_OPERATIONS_DICT[operationName]),
  );
});

test(
  'Schedule stats task and check its output',
  async () => {

    // restart queue that may be active since prev tests
    let q = await getQueue(true);
    q.stop();

    q = await getQueue(true);

    expect.assertions(1);
    const res = await q.send(
      {
        type: 'test_stats',
        account: 'catalog@rusneb.ru',
        parameters: {
          kind: 'instance',
          source: 'TestSource',
        },
      },
    );
    const waitRes = await res.promise;
    expect(Object.keys(waitRes.output).sort()).toEqual(
      [
        'collection',
        'concept',
        'group',
        'instance',
        'item',
        'organization',
        'url',
      ],
    );
    q.stop();
  },
  60 * 1000,
);

test('Schedule', async (done) => {
  expect.assertions(6);
  const q = await getQueue(true);
  const res = await q.send({
    type: 'test',
    account: 'catalog@rusneb.ru',
    parameters: { param1: 'initial parameters' },
  });
  expect(omit(res.operation, ['id', 'created_at'])).toEqual({
    '@type': 'http://www.w3.org/ns/hydra/core#Operation',
    'account': 'catalog@rusneb.ru',
    'bytes_completed': 0,
    'bytes_estimated': null,
    'documents_completed': 0,
    'documents_estimated': null,
    'kind': 'operation',
    'output': null,
    'parameters': {
      'param1': 'initial parameters',
    },
    'requires': null,
    'retries': 0,
    'running_time': [
      null,
      null,
    ],
    'state': LRO_OPERATION_STATE.PENDING,
    'type': 'test',
    'worker_pid': null,
  });
  const waitRes = await res.promise;
  expect(omit(waitRes, ['worker_pid', 'created_at', 'running_time'])).toEqual({
    '@type': 'http://www.w3.org/ns/hydra/core#Operation',
    id: res.operation.id,
    retries: 0,
    account: 'catalog@rusneb.ru',
    kind: 'operation',
    requires: null,
    state: LRO_OPERATION_STATE.SUCCESSFUL,
    bytes_completed: 0,
    bytes_estimated: null,
    documents_estimated: 7,
    documents_completed: 7,
    parameters: {
      param1: 'initial parameters',
    },
    output: null,
    type: 'test',
  });
  expect(waitRes.worker_pid).toBeGreaterThan(0);
  expect(waitRes.running_time[0]).toBeTruthy();
  expect(waitRes.running_time[1]).toBeTruthy();
  expect(waitRes.running_time[1].getTime()).toBeGreaterThan(waitRes.running_time[0].getTime());
  q.stop();
  done();
}, 10 * 60 * 1000);

test('Schedule and fail then', async (done) => {
  expect.assertions(6);
  const q = await getQueue(true);
  const res = await q.send({
    type: 'bad_test',
    account: 'catalog@rusneb.ru',
    parameters: { param1: 'initial parameters' },
  });
  expect(omit(res.operation, ['created_at', 'id'])).toEqual({
    account: 'catalog@rusneb.ru',
    parameters: { param1: 'initial parameters' },
    retries: 0,
    state: LRO_OPERATION_STATE.PENDING,
    '@type': 'http://www.w3.org/ns/hydra/core#Operation',
    kind: 'operation',
    bytes_completed: 0,
    bytes_estimated: null,
    documents_estimated: null,
    documents_completed: 0,
    running_time: [null, null],
    requires: null,
    output: null,
    type: 'bad_test',
    worker_pid: null,
  });

  let completedTask = await res.promise;
  completedTask = completedTask.output && completedTask.output.error
    ? {
      ...completedTask,
      output: { error: completedTask.output.error },
    }
    : completedTask;

  expect(omit(completedTask, ['worker_pid', 'created_at', 'running_time'])).toEqual({
    id: res.operation.id,
    account: 'catalog@rusneb.ru',
    bytes_completed: 0,
    '@type': 'http://www.w3.org/ns/hydra/core#Operation',
    kind: 'operation',
    bytes_estimated: null,
    documents_completed: 6,
    documents_estimated: 7,
    output: {
      error: 'Surprise!',
      // 'stack': 'Error: Surprise!\n    at bad_test (/mnt/d/neb-catalog/src/services/__tests__/lro.test.js:67:11)\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\n    at _takeOperation (/mnt/d/neb-catalog/src/services/lro/home.js:202:24)',
    },
    parameters: {
      param1: 'initial parameters',
    },
    requires: null,
    retries: 0,
    type: 'bad_test',
    state: LRO_OPERATION_STATE.FAILED,
  });
  expect(completedTask.worker_pid).toBeGreaterThan(0);
  const tsr = completedTask.running_time;
  expect(tsr[0]).toBeTruthy();
  expect(tsr[1]).toBeTruthy();
  expect(tsr[1].getTime()).toBeGreaterThan(tsr[0].getTime());
  q.stop();
  done();
}, 10 * 60 * 1000);

test(
  'Execution order',
  async (done) => {
    const q = await getQueue(true);
    expect.assertions(3);
    const tasksWaits = [];

    tasksWaits.push(q.send({
      type: 'long_test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 1 },
    }));
    tasksWaits.push(q.send({
      type: 'short_test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 2 },
    }));
    tasksWaits.push(q.send({
      type: 'long_test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 3 },
    }));
    tasksWaits.push(q.send({
      type: 'bad_short_test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 4 },
    }));
    tasksWaits.push(q.send({
      type: 'short_test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 5 },
    }));
    tasksWaits.push(q.send({
      type: 'short_test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 6 },
    }));
    const raw = await Promise.all((await Promise.all(tasksWaits)).map(({ promise }) => promise));
    const res = sortBy(raw, ({ running_time }) =>
      parseTsRange(running_time)[0].getTime(),
    );
    const resultingOrder = res.map(({ parameters }) => parameters.order);
    expect(resultingOrder).toEqual([1, 2, 3, 4, 5, 6]);

    const resultingOutput = res.map(({ output }) => output && output.error ? { error: output.error } : output);
    expect(resultingOutput).toEqual([
      null,
      null,
      null,
      {
        error: 'Surprise!',
        // 'stack': 'Error: Surprise!\n    at bad_short_test (/mnt/d/neb-catalog/src/services/__tests__/lro.test.js:119:11)\n    at runNextTicks (internal/process/task_queues.js:62:5)\n    at listOnTimeout (internal/timers.js:518:9)\n    at processTimers (internal/timers.js:492:7)\n    at _takeOperation (/mnt/d/neb-catalog/src/services/lro/home.js:202:24)',
      },
      null,
      null,
    ]);
    const resultingState = res.map(({ state }) => state);
    expect(resultingState).toEqual([
      LRO_OPERATION_STATE.SUCCESSFUL,
      LRO_OPERATION_STATE.SUCCESSFUL,
      LRO_OPERATION_STATE.SUCCESSFUL,
      LRO_OPERATION_STATE.FAILED,
      LRO_OPERATION_STATE.SUCCESSFUL,
      LRO_OPERATION_STATE.SUCCESSFUL,
    ]);
    q.stop();
    done();
  },
  30 * 1000,
);

test('Cancellation', async () => {
    expect.assertions(1);
    const q = await getQueue(true);
    const opShort1 = await q.send({
      type: 'test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 1 },
    });
    const opLong = await q.send({
      type: 'long_test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 2 },
    });
    const opShort2 = await q.send({
      type: 'test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 3 },
    });
    await q.cancel(opLong.operation.id, 'catalog@rusneb.ru');
    const resultingState = await Promise.all([opShort1.promise, opLong.promise, opShort2.promise]);
    expect(
      resultingState.map(
        ({ state, parameters }) => ([parameters.order, state]),
      ),
    ).toEqual([
      [1, LRO_OPERATION_STATE.SUCCESSFUL],
      [2, LRO_OPERATION_STATE.CANCELLED],
      [3, LRO_OPERATION_STATE.SUCCESSFUL],
    ]);
    q.stop();
  },
  10 * 1000,
);


test('Cold worker with pre-Cancellation', async () => {
    expect.assertions(1);
    const q = await getQueue(false);
    const opShort1 = await q.send({
      type: 'test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 1 },
    });
    const opLong = await q.send({
      type: 'long_test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 2 },
    });
    const opShort2 = await q.send({
      type: 'test',
      account: 'catalog@rusneb.ru',
      parameters: { order: 3 },
    });
    await q.cancel(opLong.operation.id, 'catalog@rusneb.ru');
    q.stop();
    const qWorker = await getQueue(true);
    const resultingState = await Promise.all([opShort1.promise, opLong.promise, opShort2.promise]);
    expect(
      resultingState.map(
        ({ state, parameters }) => ([parameters.order, state]),
      ),
    ).toEqual([
      [1, LRO_OPERATION_STATE.SUCCESSFUL],
      [2, LRO_OPERATION_STATE.CANCELLED],
      [3, LRO_OPERATION_STATE.SUCCESSFUL],
    ]);
    qWorker.stop();
  },
  10 * 1000,
);

