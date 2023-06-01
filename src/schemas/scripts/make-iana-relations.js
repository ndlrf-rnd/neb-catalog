const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { x2j } = require('../../utils/x2j');

const IANA_RELATIONS_XML_URL = "https://www.iana.org/assignments/link-relations/link-relations.xml";
const IANA_RELATIONS_OUTPUT_PATH = path.join(__dirname, '../iana-relations.json');

const makeIanaRelationsSchema = async (
  inputUrl = IANA_RELATIONS_XML_URL,
  outputPath = IANA_RELATIONS_OUTPUT_PATH,
) => {
  outputPath = outputPath.replace(/(\.json)$/ui, `.${(new Date()).toISOString().split('T')[0]}$1`);
  process.stdout.write(`Converting ${inputUrl} --> ${outputPath} ... `)
  const xmlContent = await (await fetch(inputUrl)).text();

  const ianaJson = x2j(xmlContent, {compact:true, alwaysArray: true})
  fs.writeFileSync(
    outputPath,
    JSON.stringify(ianaJson, null, 2),
    'utf-8',
  );
};

makeIanaRelationsSchema().catch(
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
  makeIanaRelationsSchema,
};