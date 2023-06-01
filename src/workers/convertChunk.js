const formats = require('../formats');
const {
  warn,
  info,
  debug,
  sanitizeUuid,
  flatten,
  error,
  cpMap,
  forceArray,
} = require('../utils');

const convertChunk = async (records, ctx) => {
  try {
    return flatten(
      await cpMap(
        forceArray(records),
        async record => {
          if (!record) {
            return [];
          }
          const fromType = record.mediaType || record.media_type;
          let toType = ctx.mediaType;
          const format = formats[fromType] || {};
          const to = format && format.to || null;
          if (record.relation_kind) {
            toType = null;
          } else {

            info(`[WORKER:${process.pid}] ${record.kind}/${record.source}/${record.key}#${record.provider || ctx.provider} (${record.serial} SipHash2-4:${sanitizeUuid(record.record_hash)}) ${fromType} --> ${toType}`);
            if (!(to && to[toType])) {
              warn(`[WORKER:${process.pid}] Record format is not possible to convert ${fromType} --> ${toType}`);
              debug(`[WORKER:${process.pid}] Falling back to original media type ${fromType}`);
              // console.log(record, ctx);
              toType = fromType;

            }
            if (!(to && to[toType])) {
              warn(`[WORKER:${process.pid}] Record format is not possible to convert ${fromType} --> ${toType}`);
              debug(`[WORKER:${process.pid}] Returning record as is`);
              // console.log(record, ctx);
              toType = null;
            }
          }
          return (toType && to[toType]
              ? forceArray(await to[toType](record.record, ctx))
              : [{ metadata: { record: record.record } }]
          ).map(
            v => ({
              ...record,
              record: v,
              // null as toType value should be preserved till this point as mark disabling convertation
              type: toType === null ? fromType : toType,
            }),
          );

        },
      ),
    );
  } catch (e) {
    error(e);
    return [];
  }
};


module.exports = {
  convertChunk,
};
