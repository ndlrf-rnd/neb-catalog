const fs = require('fs');
const path = require('path');
const flatten = require('lodash.flatten');
const data = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'heritage__kpnam.rusneb.ru-2019-12-17.json'),
  'utf-8',
));

const dryObj = r => {
  if (Array.isArray(r)) {
    return r.map(dryObj);
  }
  const nr = {};
  if (r) {
    Object.keys(r).sort().forEach(
      (k) => {
        if (Array.isArray(r[k])) {
          const o = r[k].map(dryObj);
          if (o.length > 0) {
            nr[k] = o;
          }
        } else if (typeof r[k] === 'object') {
          const o = dryObj(r[k]);
          if (Object.keys(o).length > 0) {
            nr[k] = o;
          }
        } else if ((r[k] === 0) || (r[k])) {
          nr[k] = r[k];
        }
      },
    );
  }
  return nr;
};
const cleanData = flatten(
  dryObj(data).map(
    ({ copies }) => copies.filter(({ deleted }) => !deleted).map(
      ({ num, copy_eid, created_at, updated_at }) => ({
        kind: 'item',
        source_from: 'heritage',
        key_from: num,
        source_to: 'RuMoRGB',
        key_to: copy_eid,
        time_sys: [created_at, updated_at],
      }),
    ),
  ),
);
const rgbToKp = {};
cleanData.forEach(({ key_from, key_to }) => rgbToKp[key_to] = key_from);

const NUMBERS = fs.readFileSync(path.join(__dirname, 'heritage__items__details_RuMoRGB.tsv'), 'utf-8').split('\n').map(row => {
  const rowParts = row.split('\t');
  rowParts[5] = rgbToKp[rowParts[2]] || rowParts[5];
  return rowParts.join('\t') + '\n';
});
process.stdout.write(NUMBERS);
