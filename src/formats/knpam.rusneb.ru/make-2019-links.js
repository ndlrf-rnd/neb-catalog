const fs = require('fs');
const INPUT_PATH = process.argv[2] || 'knpam.rusneb.ru-rkp-db-2020-10-22.json';

process.stderr.write(`Loading ${INPUT_PATH}...`);
const { copies, users } = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
process.stderr.write(` done\n`);

process.stderr.write(`Processing ${users.length} user records...`);
const usersDict = users.reduce((a, u) => ({
  ...a,
  [u.id]: u,
}), {});

process.stderr.write(` done\n`);
process.stderr.write(`Processing ${copies.length} copies`);
const copiesMapping = copies.filter(
  ({ ec_comment, copy_eid, neb_url, deleted }) => (deleted === 0) && (ec_comment || neb_url),
).reduce(
  (a, o) => ({
    ...a,
    [o.num]: {
      ...o,
      user: usersDict[o.user_id],
      org_name: usersDict[o.user_id].org_name,
      storage_url: `${o.ec_comment || ''}`.replace(/^.*\/(rsl[^\/.]+\.pdf).*$/uig, 'https://storage.rusneb.ru/kp/RuMoRGB/$1')
    },
  }),
  {},
);
process.stderr.write(` done\n`);
process.stderr.write(`Writing ${Object.keys(copiesMapping).length} output records to STDOUT...\n`);
const fields = ['num', 'org_name', 'copy_eid', 'neb_url', 'ec_comment', 'ec_date', 'storage_cypher', 'system_number', 'storage_url'];
process.stdout.write((fields.join('\t')) + '\n');
Object.keys(copiesMapping).sort().map(copyKey => copiesMapping[copyKey]).forEach(
  rec => process.stdout.write(
    fields.map(f => `${rec[f] || ''}`.replace(/\t/uig, '\\t')).join('\t') + '\n',
  ),
);
process.stderr.write(`Everything done\n`);
// );
