/**
 * @module Long-Rcunning Operations engine
 */

const yaml = require('js-yaml');
const { ms2minStr, removeEmpty, padRight, padLeft, prettyBytes } = require('../../utils');

const formatReport = (reportObj) => [
  '',
  '-- Report -----------',
  yaml.safeDump(removeEmpty(reportObj)).trim(),
  '---------------------',
].join('\n');

const formatProgress = (statusObj, prevStatusObj, startedTs) => {
  const msPassed = prevStatusObj.ts ? (statusObj.ts - prevStatusObj.ts) : 0;
  const secondsPassed = msPassed / 1000;
  return [
    padRight(`[${statusObj.type}:${statusObj.state}]`, 24),
    ...(
      (statusObj.state === 'PROCESSING')
        ? [
          padLeft(`et:${ms2minStr(statusObj.ts - startedTs)}`, 10),
          padLeft(`${statusObj.documents_completed}`, 9),
          statusObj.documents_estimated ? `/ ${statusObj.documents_estimated}` : '',
          padLeft(`(${((statusObj.documents_completed - (prevStatusObj.documents_completed || 0)) / secondsPassed).toFixed(0)} rec/sec)`, 16),
          `${padLeft(statusObj.bytes_completed ? prettyBytes(statusObj.bytes_completed, 1) : '...', 10)}`,
          padLeft(`(${prettyBytes((statusObj.bytes_completed - (prevStatusObj.bytes_completed || 0)) / secondsPassed, 1)}/sec)`, 15),
        ]
        : []
    ),
  ].join(' ');
};

module.exports = {
  formatReport,
  formatProgress,
};
