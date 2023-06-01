// eslint-disable-next-line no-console
const fs = require('fs');
const path = require('path');
const { mkdirpSync } = require('./fs');
const { LOGS_DIR } = require('../constants');
const debug = (!!process.env.DEBUG) ? console.debug : () => null;

// eslint-disable-next-line no-console
// const info = console.info;
const info = (...args) => process.stdout.write(`${args.map(v => `${v}`).join(' ')}\n`);

// eslint-disable-next-line no-console
// const warn = console.warn;
const warn = (...args) => process.stderr.write(`${args.map(v => `${v}`).join(' ')}\n`);

if (!fs.existsSync(LOGS_DIR)) {
  try {
    mkdirpSync(LOGS_DIR);
  } catch (e) {
    warn(`[LOGGING:${process.pid}] WARNING: Failure during ${LOGS_DIR} folder creation: ${e.message}`);
  }
}
const errorLogPath = path.join(LOGS_DIR, `error.${process.pid}.log`);

const error = (...args) => {
  // eslint-disable-next-line no-console
  console.error(...args);
  fs.appendFileSync(errorLogPath, `${args.map(v => `${v}`).join(' ')}\n`, 'utf-8');
};

// eslint-disable-next-line no-console
const log = (...args) => (process.env.DEBUG ? console.debug(...args) : null);

module.exports = {
  debug,
  info,
  warn,
  error,
  log,
};
