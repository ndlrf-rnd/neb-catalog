const arrays = require('./arrays');
const dataObject = require('./dataObject');
const fs = require('./fs');
const humanize = require('./humanize');
const json = require('./json');
const jsonata = require('./jsonata');
const log = require('./log');
const objects = require('./objects');
const streams = require('./streams');
const promises = require('./promises');
const text = require('./text');
const time = require('./time');
const types = require('./types');
const url = require('./url');
const la = require('./la');
const x2jj2x = require('./x2j');

module.exports = {
  ...arrays,
  ...dataObject,
  ...fs,
  ...humanize,
  ...json,
  ...jsonata,
  ...la,
  ...log,
  ...objects,
  ...promises,
  ...streams,
  ...text,
  ...time,
  ...types,
  ...url,
  ...x2jj2x,
};
