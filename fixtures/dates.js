const sf = require('../../string-fingerprint/src');
const fs = require('fs');
const uniq = require('lodash.uniq');
const path = require('path');
const jsonata = require('jsonata');
j = jsonata('**.items.**.date');
const vals = j.evaluate(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'kpdb.json'), 'utf-8')),
);
const dd = uniq(
  vals.filter(
    v => !v.match(/^[ 0-9\-\[\]]+$/uig),
  ).map(
    v => v.trim().replace(/[\[\]]/uig, '').replace(/[ ]+/uig, ' '),
  ),
).filter(v => v.length > 2).sort().reduce(
  (a, v) => ({
    ...a,
    [sf(v)]: (a[sf(v)] || []).concat([v]),
  }),
  {},
);
const outputTsv = Object.keys(dd).sort().map(k => {
  if (dd[k].length < 2) {
    dd[k] = dd[k].concat([dd[k][0].replace(/[0-9]{2,4}/ug,
      v => `${parseInt(v) + 13}`.substring(0, v.length))
      .replace(/XVIII([^I])/uig, 'XIX$1')
      .replace(/XVII([^I])/uig, 'XVIII$1')
      .replace(/XVI([^I])/uig, 'XVII$1'),

    ]);
  }
  return [
    dd[k].sort()[0],
    dd[k].sort().slice(-1)[0],
  ].map(
    (vv, idx) => `${idx === 0 ? 'dev' : 'val'}\t${k}\t${vv}`,
  ).join('\n');
}).join('\n');
['dev', 'val'].forEach(cat => {
  fs.writeFileSync(
    path.join(__dirname, `overhumanized-${cat}-fp.tsv`),
    outputTsv.split('\n').filter(s => s.startsWith(cat)).map(
      // s => cat === 'dev' ? s.replace(/^[^\t]+\t[^\t]+\t/ui, '') : s.replace(/^[^\t]+\t/ui, '')
      s => s.replace(/^[^\t]+\t/ui, '')
    ).join('\n'),
      'utf-8',
    );

});

