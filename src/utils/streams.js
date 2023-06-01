const { StringDecoder } = require('string_decoder');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { error } = require('../utils/log');
const { TSV_CELL_SEPARATOR } = require('../formats/tsv/constants');
const { TSV_LINE_SEPARATOR } = require('../formats/tsv/constants');


const chunkBuffer = (chunk, startMarker, endMarker, encoding, limit) => {
  let chunkOffset = 0;
  const dataRecords = [];
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

const streamToTmpFile = (rs, config) => new Promise(
  (resolve, reject) => {
    const tmpPath = path.join(os.tmpdir(), `${new Date().getTime()}.tmp`);
    const ws = fs.createWriteStream(tmpPath, config.encoding || 'utf-8');
    rs.on('error', (err) => {
      error(err);
      reject(err);
    });
    rs.on('end', () => resolve(tmpPath));
    rs.pipe(ws);
  },
);


const streamToString = (rs, encoding = 'utf8') => new Promise(
  (resolve, reject) => {
    const decoder = new StringDecoder(encoding);

    const chunks = [];
    rs.on('error', (err) => {
      error(err);
      reject(err);
    });
    rs.on('data', (chunk) => {
      chunks.push(chunk);
    });
    rs.on('end', () => resolve(
      decoder.end(Buffer.concat(chunks)),
    ));
  },
);

const bufferToTabular = (
  buf,
  lineSep = TSV_LINE_SEPARATOR,
  cellSep = TSV_CELL_SEPARATOR,
) => buf.split(lineSep).filter(
  (v) => (v.trim().length > 0),
).map(
  (l) => l
    .replace(/[\r]+/ug, '')
    .replace(/[\t ]+$/uig, ''),
).filter(
  (l) => l.length > 0,
).map((l) => l.split(cellSep));


module.exports = {
  bufferToTabular,
  streamToTmpFile,
  streamToString,
  chunkBuffer,
}