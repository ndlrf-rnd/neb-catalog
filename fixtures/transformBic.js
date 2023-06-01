const moment = require('moment');
const sortBy = require('lodash.sortby');
const fs = require('fs');
const path = require('path');
const { x2j, jsonataRunner, jsonStringifySafe } = require('../src/utils');

/**
 * FastText vectors cmd:
 * $ cat bic.txt | fasttext print-sentence-vectors ../../sssearch/contrib/models/wiki.ru.bin | tr ' ' $'\t' | cut -d $'\t' -f2- > bic.vec
 */

moment.locale('ru');
const OUTPUT_PATH = path.join(__dirname, 'bic.jsonld');
const STRINGS_PATH = path.join(__dirname, 'bic.txt');
const CLOSURE_OUTPUT_PATH = path.join(__dirname, 'bic.edges');
const LABELS_PATH = path.join(__dirname, 'bic.labels.tsv');
const INPUT_PATH = path.join(__dirname, 'bic.xml');
const bic = x2j(fs.readFileSync(INPUT_PATH, 'utf-8'));
const time = (
  bic.elements.filter(({ type }) => type === 'comment')[0] || { comment: '' }
).comment.match(/Время создания:([^\n\r\\]+)/uig)[0].split(': ')[1].trim().replace(/ *г\.,/uig, '');
// Июн 27 2012 г., 15:24
const time_source = moment(time, 'MMM DD YYYY, HH:SS').toDate();
const dataWrap = jsonataRunner(`
  $.elements[$.name = 'pma_xml_export'].elements.elements[$.name = 'table'].$merge([
    $.elements.{$.attributes.name: $.elements.text}
  ])
`)(bic);
const idToSlug = dataWrap.reduce((a, { id, slug }) => ({
  ...a,
  [id]: slug,
}), {});
const entities = [
  {
    kind: 'defined_term_set',
    source: 't8print.ru',
    key: 'bic',
    media_type: 'application/ld+json',
    record: '{"@type": "http://schema.org/DefinedTermSet","name":"BIC"}',
    provider: 't8print.ru',
    time_source,
  },
  ...dataWrap.reduce(
    (a, { id, parent_id, title, slug }) => ([
      ...a,
      {
        kind: 'defined_term',
        source: 'bic',
        key: slug.toLocaleLowerCase(),
        record: `{"@type":"http://schema.org/DefinedTerm","termCode":"${slug}","name":"${title.replace(/"/uig, '\\\\"')}","inDefinedTermSet":"/resources/DefinedTermSet/t8print.ru/bic"}`,
        media_type: 'application/ld+json',
        provider: 't8print.ru',
        time_source,
      },
      {
        kind_from: 'defined_term_set',
        source_from: 't8print.ru',
        key_from: 'bic',

        kind_to: 'defined_term',
        source_to: 'bic',
        key_to: slug.toLocaleLowerCase(),
        relation_kind: 'has_defined_term',
        time_source,
      },
      ...((parent_id !== 'NULL') && (typeof idToSlug[parent_id] !== 'undefined') ? [{
        kind_from: 'defined_term',
        source_from: 'bic',
        key_from: idToSlug[parent_id].toLocaleLowerCase(),

        kind_to: 'defined_term',
        source_to: 'bic',
        key_to: slug.toLocaleLowerCase(),

        relation_kind: 'item',
        time_source,
      }] : []),
      {
        kind_from: 'defined_term_set',
        source_from: 't8print.ru',
        key_from: 'bic',
        source_to: 'bic',
        key_to: slug.toLocaleLowerCase(),
        relation_kind: 'has_defined_term',
        time_source,
      },
    ]),
    [],
  ),
];

process.stderr.write(`${INPUT_PATH} --> ${entities.length} records closure --> ${CLOSURE_OUTPUT_PATH}\n`);
fs.writeFileSync(OUTPUT_PATH, jsonStringifySafe(entities, null, 2), 'utf-8');

const closure = dataWrap.filter(({ id }) => id !== 'NULL').map(
  ({ id, parent_id }) => `${parent_id.replace(/^NULL$/uig, '0')} ${id}`,
).join('\n');

process.stderr.write(`${INPUT_PATH} --> ${entities.length} records --> ${OUTPUT_PATH}\n`);
fs.writeFileSync(CLOSURE_OUTPUT_PATH, closure, 'utf-8');

const labels = sortBy(dataWrap.filter(({ id }) => id !== 'NULL'), ({ id }) => parseInt(id, 10)).map(
  ({ id, slug, title, parent_id }) => [id, slug, title, parent_id.replace(/^NULL$/uig, '0')].join('\t'),
);

process.stderr.write(`${INPUT_PATH} --> ${labels.length} labels --> ${LABELS_PATH}\n`);
fs.writeFileSync(LABELS_PATH, ['id\tslug\ttitle\tparent_id', ...labels].join('\n'), 'utf-8');

const strings = sortBy(dataWrap, ({ id }) => parseInt(id, 10)).map(({ title }) => title);

process.stderr.write(`${INPUT_PATH} --> ${strings.length} strings --> ${STRINGS_PATH}\n`);
fs.writeFileSync(STRINGS_PATH, strings.join('\n'), 'utf-8');
