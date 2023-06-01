const path = require('path');
const heapdump = require('heapdump');
const { addFilenameSuffix } = require('./fs');
const { warn } = require('../utils/log');

/**
 * @constant DEFAULT_SNAPSHOT_FILENAME
 * @type {string}
 */
const DEFAULT_SNAPSHOT_FILENAME = './snapshot.heapsnapshot';

/**
 * @constant DEFAULT_HEAP_SNAPSHOT_INTERVAL_MS
 * @type {number}
 */
const DEFAULT_HEAP_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

const runSnapshotter = () => {
  const heapSnapshotFilename = process.env.HEAP_SNAPSHOT_FILE_NAME
    || DEFAULT_SNAPSHOT_FILENAME;
  process.env.HEAP_SNAPSHOT_FILE_NAME = heapSnapshotFilename;

  const heapSnapshotIntervalMs = process.env.HEAP_SNAPSHOT_INTERVAL_MS
    || DEFAULT_HEAP_SNAPSHOT_INTERVAL_MS
    || 0;
  process.env.HEAP_SNAPSHOT_INTERVAL_MS = heapSnapshotIntervalMs;
  setInterval(() => {
    const sfn = addFilenameSuffix(
      path.resolve(heapSnapshotFilename),
      `_${(new Date()).getTime()}.heapsnapshot`,
    );
    warn(`taking memory snapshot to ${sfn} with interval ${heapSnapshotIntervalMs} ms`);
    heapdump.writeSnapshot(sfn, (err, resultFilename) => {
      if (err) {
        warn(`${err.toString()}\n`);
      } else {
        warn(`snapshot complete: ${resultFilename}\n`);
      }
    });
  }, heapSnapshotIntervalMs);
};

module.exports = {
  runSnapshotter,
};
