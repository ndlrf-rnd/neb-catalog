const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const IANA_MEDIA_TYPE_CSV_URL = 'https://www.iana.org/assignments/media-types/application.csv';
const OUTPUT_PATH = path.join(__dirname, '../iana-media-types.json');
const CSV_VALUES_REGEXP = /(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^\",]+)/g;

const makeIanaMediaTypesSchema = async (
  inputUrl = IANA_MEDIA_TYPE_CSV_URL,
  outputPath = OUTPUT_PATH,
) => {
  outputPath = outputPath.replace(/(\.json)$/ui, `.${(new Date()).toISOString().split('T')[0]}$1`);
  process.stdout.write(`Converting ${inputUrl} --> ${outputPath} ... `)
  const csvContent = await (await fetch(inputUrl)).text();
  const stringsData = csvContent.split(/[\n\r]+/ui).map(
    rowStr => {
      if (rowStr.trim().length > 0) {

        const values = [];
        let i = 0;
        let matches;
        while (matches = CSV_VALUES_REGEXP.exec(rowStr)) {
          // value = value.replace(/\"\"/g, "\"");

          values.push((matches[1] || matches[2]).replace(/""/g, '"'));
          i += 1;
        }
        return values;
      } else {
        return null;
      }
    },
  ).filter(v => (v !== null));
  const headers = stringsData[0];
  const ianaJson = stringsData.slice(1).map(
    row => headers.reduce(
      (a, field, idx) => ({
        ...a,
        [field]: row[idx],
      }),
      {},
    ),
  );
  fs.writeFileSync(
    outputPath,
    JSON.stringify(ianaJson, null, 2),
    'utf-8',
  );
};

makeIanaMediaTypesSchema().catch(
  err => {
    process.stderr.write(`ERROR: ${err}\n`)
    process.exit(1)
  }
).then(
  () => {
    process.stdout.write('Done!\n');
    process.exit(0)
  });
module.exports = {
  makeIanaMediaTypesSchema,
};