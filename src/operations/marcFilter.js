const { padRight, prettyBytes } = require('../utils/humanize');
const { sortBy, flatten } = require('../utils/');
const { fromISO2709 } = require('../formats/marc/iso2709');
const REPORT_INTERVAL_MS = 300;
let reportIntervalId = null;
const jsonata = require('jsonata');

const marcFilter = (rs, ws, jsonataExpr) => new Promise((resolve, reject) => {
  const compiledJsonata = jsonata(jsonataExpr);
  rs.on('error', reject);
  let ended = false;
  let reminder = null;
  let len = 0;
  let recordsTotal = 0;
  let recordsMatched = 0;
  let prevRecordsTotal = 0;
  reportIntervalId = setInterval(() => {
    process.stderr.write(
      [
        `progress input: ${padRight(`(${prettyBytes(len)})`, 13)}`,
        `records total: ${recordsTotal}`,
        `matched total: ${recordsMatched}`,
        `Performance: ${((recordsTotal - prevRecordsTotal) / (REPORT_INTERVAL_MS / 1000)).toFixed(0)} rps\n`,
      ].join('\t'),
    );
    prevRecordsTotal = recordsTotal;
  }, REPORT_INTERVAL_MS);

  const processChunk = (chunk) => {
    let offset = 0;
    while (offset !== -1) {
      const id = chunk.indexOf('\x1D', offset);
      // process.stdout.write('zzz', id)
      if (id !== -1) {
        recordsTotal += 1;
        const rec = compiledJsonata.evaluate(
          fromISO2709(
            chunk.slice(offset, id + 1),
          )[0],
        );
        ws.write(((typeof rec === 'object') ? JSON.stringify(rec) : rec) + '\n');
        offset = id + 1;
      } else {
        break;
      }
    }
    reminder = chunk.slice(offset);
  };
  const onEnd = () => {
    if (!ended) {
      if (reminder) {
        processChunk(reminder);
      }
      ended = true;
      resolve();
    }
  };

  rs.on('end', onEnd);
  rs.on('data', (data) => {
    rs.pause();
    len += data.byteLength;
    processChunk(reminder ? Buffer.concat([reminder, data]) : data);
    rs.resume();
  });
});
//
// const args = process.argv.slice(2);
// const idsPath = path.resolve(args[0]);
// const outputPath = args[1] ? path.resolve(args[1]) : null;
// const ids = compact(fs.readFileSync(idsPath, 'utf-8').split('\n').map((s) => s.trim()));
// process.stderr.write(`mrc input: STDIN\n   ids file: ${idsPath} (${ids.length} values)\n${outputPath ? `output file: ${outputPath}` : ''}\n`);
// let ws = process.stdout;
//
// if (outputPath) {
//   if (fs.existsSync(outputPath)) {
//     fs.unlinkSync(outputPath);
//   }
//   ws = fs.createWriteStream(outputPath);
// }
// const rs = process.stdin;
// run(process.stdin, ws, ids)
//   .then(() => {
//   process.stderr.write('Finishing... ');
//   clearInterval(reportIntervalId);
//   ws.on('end', () => {
//     process.stderr.write('done!\n');
//     process.exit(0);
//   });
//   ws.end();
// }).catch((e) => {
//   process.stderr.write(`ERROR: ${e.message}\n${e.stack}`);
//   process.exit(1);
// });
//registerOperation('marc_filter', marcFilter)

module.exports = {
  marcFilter,
};

marcFilter(
  process.stdin,
  process.stdout,
  process.argv[2] || '$',
).then(
  () => {
    process.stderr.write('Done');
    process.exit(0);
  },
).catch(
  err => {
    process.stderr.write(`ERROR:\n${err.message}\n${err.stack}`);
    process.exit(-1);
  },
);
