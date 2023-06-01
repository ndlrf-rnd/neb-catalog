const monitor = require('pg-monitor');
const path = require('path');
const fs = require('fs');
const { mkdirpSync } = require('../utils');
const { jsonStringifySafe } = require('../utils');

const attachMonitor = (dbMonitorOptions) => {
  let detailedLogger = console.log;
  let logger = console.info;

  if (process.env.DEBUG_DB) {
    mkdirpSync(path.dirname(process.env.DEBUG_DB));
    const sqlLogFp = fs.createWriteStream(process.env.DEBUG_DB, 'utf-8');
    const sqlInfoLogFp = fs.createWriteStream(`${process.env.DEBUG_DB.replace(/.[^.]+$/ui, '')}.info.log`, 'utf-8');
    const sqlDetailedFp = fs.createWriteStream(`${process.env.DEBUG_DB.replace(/.[^.]+$/ui, '')}.detailed.log`, 'utf-8');

    logger = (msg, detail) => {
      sqlLogFp.write(msg + '\n');
      sqlInfoLogFp.write(jsonStringifySafe(detail) + '\n');
    };
    detailedLogger = (value) => {
      sqlDetailedFp.write(value + '\n');
    };
  // }
  // if (process.env.NODE_ENV !== 'test') {
    monitor.attach(dbMonitorOptions);
    monitor.setTheme('matrix');
    monitor.setLog(logger);
    monitor.setDetailed(detailedLogger);
  }
};

module.exports = {
  attachMonitor,
};
