const fs = require('fs');
const path = require('path');
const jsonata = require('jsonata');
const jsyaml = require('js-yaml');
const { x2j } = require('../../../../utils/x2j');

const CONVERTOR_VERSION = '0.1.0';

const { mkdirpSync } = require('../../../../utils');

const SCHEMA_PATH = path.join(__dirname, 'RUSMARC20190324.xml');
const PATH_JSONATA = path.join(__dirname, 'rusmarc-bibliographic-to-json-schema.jsonata');
const xml = fs.readFileSync(SCHEMA_PATH, 'utf8');
const options = {
  ignoreComment: true,
  alwaysRoot: false,
  alwaysChildren: false,
  fullTagEmptyElement: false,
  alwaysArray: false,
  compact: false,
  trim: true,
};
const inputJson = x2j(xml, options); // or convert.x2j(xml, options)

const YAML_PATH = path.join(__dirname, '..', 'rsl-rusmarc-bibliographic', CONVERTOR_VERSION, 'schema.yaml');
const JSON_PATH = path.join(__dirname, '..', 'rsl-rusmarc-bibliographic', CONVERTOR_VERSION, 'schema.json');
const YAML_RAW_PATH = path.join(__dirname, '..', 'rsl-rusmarc-bibliographic', CONVERTOR_VERSION, 'schema-xml-raw.yaml');
const JSON_RAW_PATH = path.join(__dirname, '..', 'rsl-rusmarc-bibliographic', CONVERTOR_VERSION, 'schema-xml-raw.json');

const resultingSchema = jsonata(fs.readFileSync(PATH_JSONATA, 'utf-8')).evaluate(inputJson);

process.stderr.write(`${SCHEMA_PATH}  ->  ${JSON_PATH}\n`);
const jsonSchema = JSON.stringify(resultingSchema, null, 2);
mkdirpSync(path.dirname(JSON_PATH));
fs.writeFileSync(JSON_PATH, jsonSchema, 'utf8');

process.stderr.write(`${SCHEMA_PATH}  ->  ${YAML_PATH}\n`);
const yamlSchema = jsyaml.safeDump(JSON.parse(jsonSchema), { sortKeys: true });
mkdirpSync(path.dirname(YAML_PATH));
fs.writeFileSync(YAML_PATH, yamlSchema, 'utf8');

process.stderr.write(`${SCHEMA_PATH}  ->  ${JSON_RAW_PATH}\n`);
const jsonRawSchema = JSON.stringify(inputJson, null, 2);
mkdirpSync(path.dirname(JSON_RAW_PATH));
fs.writeFileSync(JSON_RAW_PATH, jsonRawSchema, 'utf8');

process.stderr.write(`${SCHEMA_PATH}  ->  ${YAML_RAW_PATH}\n`);
const yamlRawSchema = jsyaml.safeDump(JSON.parse(jsonRawSchema), { sortKeys: true });
mkdirpSync(path.dirname(YAML_RAW_PATH));
fs.writeFileSync(YAML_RAW_PATH, yamlRawSchema, 'utf8');
