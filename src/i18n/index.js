const fs = require('fs');
const path = require('path');
const jsyaml = require('js-yaml');

const LANGUAGES_TSV_PATH = path.join(__dirname, 'iso639-language-codes.tsv');
const LANGUAGES_JSON_PATH = path.join(__dirname, 'iso639-language-codes.json');
const LANGUAGES_YAML_PATH = path.join(__dirname, 'iso639-language-codes.yaml');

/**
 * Languages
 * @type {{}}
 */
const languageCodesData = fs.readFileSync(LANGUAGES_TSV_PATH, 'utf-8')
  .replace(/[\r]+/g, '')
  .split('\n')
  .filter((v) => !!v.trim())
  .map((line) => line.split('\t'));
const languagesHeader = languageCodesData[0];
const languages = languageCodesData.slice(1).map(
  (rec) => {
    const res = {};
    languagesHeader.forEach(
      (field, idx) => {
        res[field] = rec[idx] || null;
      },
    );
    return res;
  },
);

if (!fs.existsSync(LANGUAGES_JSON_PATH)) {
  fs.writeFileSync(LANGUAGES_JSON_PATH, JSON.stringify(languages, null, 2), 'utf-8');
}
if (!fs.existsSync(LANGUAGES_YAML_PATH)) {
  fs.writeFileSync(LANGUAGES_YAML_PATH, jsyaml.safeDump(languages, { sortKeys: true }), 'utf-8');
}

const COUNTRIES_TSV_PATH = path.join(__dirname, 'iso3166-country-codes.tsv');
const COUNTRIES_JSON_PATH = path.join(__dirname, 'iso3166-country-codes.json');
const COUNTRIES_YAML_PATH = path.join(__dirname, 'iso3166-country-codes.yaml');

/**
 * Countrues
 * @type {{}}
 */

const countryCodesData = fs.readFileSync(COUNTRIES_TSV_PATH, 'utf-8')
  .replace(/[\r]+/g, '')
  .split('\n')
  .filter((v) => !!v.trim())
  .map((line) => line.split('\t'));
const countriesHeader = countryCodesData[0];
const countries = countryCodesData.slice(1).map(
  (rec) => countriesHeader.reduce(
    (a, field, idx) => ({
      ...a,
      [field]: rec[idx] || null,
    }),
    {},
  ),
);


if (!fs.existsSync(COUNTRIES_JSON_PATH)) {
  fs.writeFileSync(COUNTRIES_JSON_PATH, JSON.stringify(countries, null, 2), 'utf-8');
}
if (!fs.existsSync(COUNTRIES_YAML_PATH)) {
  fs.writeFileSync(COUNTRIES_YAML_PATH, jsyaml.safeDump(countries, { sortKeys: true }), 'utf-8');
}
