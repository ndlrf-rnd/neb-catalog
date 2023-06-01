const { executeParallel, initWorker } = require('./workers');
const { convertChunk } = require('./convertChunk');
const { importChunk } = require('./importChunk');

initWorker(
  {
    importChunk,
    convertChunk,
  },
);

module.exports = {
  initWorker,
  executeParallel,
};
