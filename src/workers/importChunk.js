const { error, forceArray, flattenDeep, isEmpty, cpMap } = require('../utils');
const { insert } = require('../dao/dao');
const formats = require('../formats');

const { DEFAULT_MEDIA_TYPE } = require('../constants');

const importChunk = async (chunkRecords, config) => {
  const format = formats[config.mediaType || DEFAULT_MEDIA_TYPE];
  if (typeof format.toEntities !== 'function') {
    throw new Error(`Error: making SID entities from ${format.mediaType} format is currently not supported.`);
  } else if (typeof format.mediaType !== 'string') {
    throw new Error(`Error: invalid media type: ${config.mediaType}.`);
  }
  const entitiesAndRelations = flattenDeep(
    await cpMap(
      forceArray(chunkRecords),
      async chunkRecord => {
        let chunkRecBuffer;
        if (Buffer.isBuffer(chunkRecord)) {
          chunkRecBuffer = chunkRecord;
        } else if ((typeof chunkRecord === 'object') && (chunkRecord.data)) {
          chunkRecBuffer = Buffer.from(chunkRecord.data);
        } else if (isEmpty(chunkRecord)) {
          chunkRecBuffer = null;
        } else {
          chunkRecBuffer = chunkRecord;
        }
        try {
          return chunkRecBuffer ? (await format.toEntities(chunkRecBuffer, config)) : [];
        } catch (e) {
          error(`ERROR: ${e.message}\n${e.stack}`);
          throw e;
        }
      },
    ),
  );
  if (config.noop) {
    return {};
  }
  return await insert(entitiesAndRelations, config.provider);
};

module.exports = {
  importChunk,
};
