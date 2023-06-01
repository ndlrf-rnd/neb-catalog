const os = require('os');
const path = require('path');
const shellJs = require('shelljs');
const fs = require('fs');
const fetch = require('node-fetch');
const FetchProgress = require('node-fetch-progress');
const { kMaxLength } = require('buffer');
const formats = require('./../formats');
const {
  CLEANUP_SUCCESSFUL_IMPORT_FILES,
  CLEANUP_FAILED_IMPORT_FILES
} = require('../constants');
const { omit } = require('../utils');
const { refreshDbStats } = require('../dao/dao');

const {
  lengthInBytes,
  escapeUnprintable,
  error,
  info,
  defaults,
  warn,
  isEmpty,
  mergeObjectsReducer,
} = require('../utils');
const { executeParallel } = require('../workers');


const { DEFAULT_ENCODING } = require('../crypto/md5');

const {
  DEFAULT_JOBS,
  DEFAULT_MEDIA_TYPE,
  DEFAULT_DOWNLOAD_HEADERS,
  FETCH_PROGRESS_PARAMS,
  FETCH_PARAMS,
  MAX_POOL_PER_WORKER_SIZE_BYTES,
} = require('../constants');


const ensureProvider = async (config) => {
  config.provider = config.provider || process.env.SID_PROVIDER;
  if (!config.provider) {
    throw new Error(
      'Data provider is not defined for import, can\'t continue.' +
      `Hint: use "SID_PROVIDER=DpName" env variable or CLI argument: "--provider <DpName>"`,
    );
  }
  return config.provider;
};


const chunkBuffer = (chunk, startMarker, endMarker, encoding, limit) => {
  let chunkOffset = 0;
  const dataRecords = [];
  if ((!startMarker) && (!endMarker)) {
    return [[], chunk];
  }
  while (chunkOffset !== -1) {
    if (limit && (dataRecords.length >= limit)) {
      break;
    }
    // Buffer indexOf may accept string pattern with appropriate encoding clue.
    // Official source: https://nodejs.org/api/buffer.html#buffer_buf_indexof_value_byteoffset_encoding
    const haveStartMarker = (Buffer.isBuffer(startMarker) || (typeof startMarker === 'string') || (typeof startMarker === 'number'));
    const haveEndMarker = (Buffer.isBuffer(endMarker) || (typeof endMarker === 'string') || (typeof endMarker === 'number'));
    let startId;
    let endId;

    if (haveStartMarker) {
      startId = chunk.indexOf(startMarker, chunkOffset, encoding);
    } else {
      startId = chunkOffset;
    }

    if (haveEndMarker) {
      endId = chunk.indexOf(endMarker, startId, encoding);
      if (endId > startId) {
        endId += endMarker.length;
      } else {
        endId = undefined;
      }
    } else if (haveStartMarker) {
      const nextStartId = chunk.indexOf(startMarker, startId, encoding);
      if (nextStartId !== -1) {
        endId = nextStartId - startMarker.length;
      } else {
        endId = chunk.length;
      }
    }
    if (endId && (endId > startId)) {
      dataRecords.push(chunk.slice(startId, endId));
      chunkOffset = endId;
    } else {
      // Unclosed record going to tail
      chunkOffset = startId;
      break;
    }
  }
  return [dataRecords, chunk.slice(chunkOffset)];
};
const flushCache = (cachePath) => {
  if (cachePath && fs.existsSync(cachePath)) {
    try {
      warn(`[LRO:IMPORT:${process.pid}] Removing import buffer file ${cachePath} ...`);
      fs.unlinkSync(cachePath);
      warn(`[LRO:IMPORT:${process.pid}] Successfully removed import buffer file ${cachePath}`);
    } catch (e) {
      error(`[LRO:IMPORT:${process.pid}] Failed to remove buffer file ${cachePath}l ERROR: ${e.message}\n${e.stack}`);
    }
  }
};

const makeCachedRs = async (inputRs, extension, onProgress) => {
  let cachePath;

  cachePath = path.join(
    os.tmpdir(),
    `${(new Date()).getTime()}.stream${extension ? extension.replace(/^[.]?/uig, '.') : ''}`,
  );
  return new Promise((resolve, reject) => {
    let cacheWs = fs.createWriteStream(cachePath)
      .on('error', (err) => {
        error('Cache ws error', err);
        throw err;
      });
    inputRs
      .on('error', (err) => {
        error(err);
        throw err;
      })
      .pipe(cacheWs)
      .on('finish', () => {
        cacheWs.end();
        info(`[LRO:WORKER:${process.pid}:importStream] Stream cache file created ${cachePath}`);
        if (extension === 'gz') {
          const decompressedPath = cachePath.replace(/\.gz$/, '');
          warn(`[LRO:import:${process.pid}] Decompressing ${cachePath} -> ${decompressedPath}`);
          shellJs.exec(`pigz -d ${cachePath}`);
          if (fs.existsSync(decompressedPath) && (typeof onProgress === 'function')) {
            const size = fs.statSync(decompressedPath).size;
            onProgress({
              bytes_estimated: size,
              bytes_completed: size,
              documents_estimated: 1,
            });
          }
          flushCache(cachePath);
          cachePath = decompressedPath;
        }
        warn(`[LRO:import:${process.pid}] Returning stream from ${cachePath}`);
        const rs = fs.createReadStream(cachePath).on('finish', () => {
          warn(`[LRO:IMPORT:${process.pid}] import is successfully finished.`);
          if (CLEANUP_SUCCESSFUL_IMPORT_FILES) {
            flushCache(cachePath);
          }
        }).on('error', (err) => {
          error(`[LRO:IMPORT:${process.pid}] import failed with ERROR: ${err.message}\n${err.stack}`);
          if (CLEANUP_FAILED_IMPORT_FILES) {
            flushCache(cachePath);
          }
        });
        resolve(rs);
      });
  });
};


const importStream = (rs, config, onProgress) => (
  new Promise(
    async (resolve, reject) => {
      try {
        config.provider = await ensureProvider(config);

        const maxPoolSize = MAX_POOL_PER_WORKER_SIZE_BYTES * (config.jobs || DEFAULT_JOBS);
        const bytesEstimated = config.bytesEstimated || (fs.existsSync(rs.path) ? fs.statSync(rs.path).size : null);

        const stats = [];
        let isProcessingCompleted = false;

        let pool = [];
        let bytesCompleted = 0;

        let poolLen = 0;
        let documentsCompleted = 0;

        let batchSizeBytes = 0;
        let batchSizeDocuments = 0;
        let header = null;
        const mediaType = config.mediaType || config.media_type || DEFAULT_MEDIA_TYPE;
        const format = formats[mediaType];
        if (!format) {
          warn(`Format not found for media-type: ${mediaType}`);
        }
        const encoding = (format && format.encoding) || config.encoding || DEFAULT_ENCODING;
        const onCompleteChunk = async (chunk, isLast = false) => {
          let recordBuffers;
          let tailBuffer;
          if ((!isEmpty(format.endHeaderMarker)) && (!header)) {
            const [wrappedHeaderBuffer, headlessChunk] = chunkBuffer(chunk, format.startHeaderMarker, format.endHeaderMarker, encoding, 1);
            if (wrappedHeaderBuffer.length === 1) {
              header = (typeof format.processHeader === 'function')
                ? await format.processHeader(wrappedHeaderBuffer[0], config)
                : wrappedHeaderBuffer[0];
              warn(`[LRO:WORKER:${process.pid}:importStream] Detected TSV header (${lengthInBytes(wrappedHeaderBuffer[0])} bytes, EndOfHeader symbol: "${escapeUnprintable(format.endHeaderMarker)}", decoded string: [ ${header.join(' | ')} ]`);
            } else {
              warn(`[LRO:WORKER:${process.pid}:importStream] WARNING: Unexpected header buffers count: ${wrappedHeaderBuffer.length}. No header will be used.`);
            }
            chunk = headlessChunk;
          }

          // Chunk is outside possible header
          let chunkingResult;
          if ((!format.startMarker) && (!format.endMarker) && isLast) {
            chunkingResult = [[chunk], Buffer.from([])];
          } else {
            chunkingResult = chunkBuffer(chunk, format.startMarker, format.endMarker, encoding, config.limit);
          }

          recordBuffers = chunkingResult[0];
          tailBuffer = chunkingResult[1];

          batchSizeDocuments = recordBuffers.length;
          documentsCompleted += recordBuffers.length;
          let result = [];
          if (recordBuffers.length > 0) {
            result = await executeParallel(
              'importChunk',
              recordBuffers,
              {
                ...config,
                header,
              },
            );
          }
          const batchExecutionReport = {
            bytes_completed: bytesCompleted,
            bytes_estimated: bytesEstimated,
            documents_completed: documentsCompleted,
            ...((result || []).reduce(
              (a, o) => mergeObjectsReducer(a, o),
              {},
            )),
          };
          if (typeof (onProgress) === 'function') {
            await onProgress(batchExecutionReport);
          }
          stats.push(batchExecutionReport);

          // Finalize
          batchSizeBytes = 0;
          return tailBuffer;
        };


        const onEnd = async () => {
          try {
            // Final chunk
            const mergedChunks = Buffer.concat(pool);
            if (mergedChunks.length > 0) {
              //No tail
              await onCompleteChunk(mergedChunks, true);
            }
            if (!isProcessingCompleted) {
              isProcessingCompleted = true;
              resolve(omit(
                stats.reduce((a, o) => mergeObjectsReducer(a, o, false), {}),
                ['bytes_completed', 'bytes_estimated', 'documents_estimated', 'documents_completed'],
              ));
              await refreshDbStats();
            }
          } catch (e) {
            if (typeof onProgress === 'function') {
              onProgress();
            }
            await refreshDbStats();
            error('ERROR: Parallel execution fail:', e);
            reject(e);
          }
        };

        const onData = async (data) => {
          rs.pause();
          bytesCompleted += data.byteLength;
          batchSizeBytes += data.byteLength;
          poolLen += data.byteLength;
          pool.push(data);
          if (poolLen >= maxPoolSize) {

            let tail = null;
            const mergedChunks = Buffer.concat(pool);
            if (mergedChunks.length > 0) {
              tail = await onCompleteChunk(mergedChunks);
            }
            if (tail) {
              pool = [tail];
              poolLen = tail.byteLength;
            } else {
              pool = [];
              poolLen = 0;
            }
          }
          if ((config.limit && (config.limit > 0)) && (documentsCompleted >= config.limit)) {
            onEnd().then(() => rs.end());
          } else {
            rs.resume();
          }
        };

        rs.on('error', (err) => {
          error(err);
          reject(err);
        });
        const fileSize = rs.path ? fs.statSync(rs.path).size : null;
        if (
          (!format) || (!(format.endHeaderMarker || format.startHeaderMarker || format.startMarker || format.endMarker)) &&
          (typeof fileSize === 'number') && (fileSize < kMaxLength)
        ) {
          config.sync = true;
          rs.on('data', (data) => pool.push(data));
        } else {
          rs.on('data', onData);
        }
        rs.on('end', onEnd);
      } catch (e) {
        if (rs) {
          try {
            rs.end();
          } catch (e) {
            warn(`WARN: Can't close read stream properly`);
          }
        }
        await refreshDbStats();
        reject(e);
      }
    },
  )
);
const importUrl = async (config, onProgress) => {
  config = { ...config, ...config.parameters };
  const url = config.url;
  const response = await fetch(
    url,
    defaults(
      {
        method: 'get',
        headers: DEFAULT_DOWNLOAD_HEADERS,
      },
      FETCH_PARAMS,
    ),
  );
  const extension = `${url}`.split('?')[0].split('/').slice(-1)[0].split('.').slice(-1)[0]; //mime.getExtension(response.headers.get('content-type'))
  const resStatus = parseInt(response.status || -1);
  if ((resStatus < 200) || (resStatus >= 400)) {
    throw new Error(
      `Operation failed because remote URL ${url} returned response code ${resStatus} and message "${response.statusText}".`,
    );
  }

  const onDlProgress = (statusObj) => {
    statusObj.ts = (new Date()).getTime();
    warn(`[LRO:WORKER:${process.pid}:importUrl] ${url} -> ${(statusObj.progress * 100).toFixed(2)}% ${statusObj.doneh} / ${statusObj.totalh} at ${statusObj.rateh} will finish in ${statusObj.etah}`);
    if (typeof onProgress === 'function') {
      onProgress({
        ...statusObj,
        bytes_estimated: statusObj.done,
        bytes_completed: statusObj.total,
      });
    }
  };

  const progress = new FetchProgress(response, FETCH_PROGRESS_PARAMS);
  progress.on('progress', onDlProgress);

  if (response.size) {
    config.bytesCompressedEstimated = response.size;
  }
  const rs = await makeCachedRs(response.body, extension, onProgress);
  const result = await importStream(rs, config, onProgress);
  const cachePath = rs.path;
  if (!rs.readableEnded) {
    rs.end();
  }
  if (CLEANUP_SUCCESSFUL_IMPORT_FILES) {
    flushCache(cachePath);
  }
  return result;
};

module.exports = {
  importUrl,
  importStream,
};
