const fs = require('fs');
const path = require('path');
const traverse = require('traverse');
const jsyaml = require('js-yaml');
const {
  mkdirpSync,
  padLeft,
  uniq,
  pick,
  setWith,
  mapValues,
} = require('../../../src/utils');

const CONVERTOR_VERSION = '0.1.0';

const YAML_PATH = path.join(__dirname, 'rsl-marc-bibliographic', CONVERTOR_VERSION, 'schema.yaml');
const JSON_PATH = path.join(__dirname, 'rsl-marc-bibliographic', CONVERTOR_VERSION, 'schema.json');


const SCHEMA_PATH = path.join(__dirname, 'marc-bibliographic-schema.json');
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const INDICATORS_PATH = path.join(__dirname, 'indicators.json');
const indicators = JSON.parse(fs.readFileSync(INDICATORS_PATH, 'utf8'));
const FIELDS = ['entity', 'time', 'idType', 'relation', 'source', 'sourceType'];

const mapping = {};

traverse(schema).forEach(function visit(x) {
  const fieldObj = { _: pick(x, FIELDS) };
  let p = [...this.path];
  if ((!this.isLeaf) && (Object.keys(fieldObj._).length > 0)) {
    if (p[1] === 'positions') {
      const pp = p[0] === '006' ? schema[p[0]].positions[p[2]][p[3]] : schema[p[0]].positions[p[2]];
      const start = padLeft(pp.start, 2, '0');
      const stop = padLeft(pp.stop, 2, '0');
      const posKey = (start === stop) ? start : `${start}-${stop}`;
      p = [p[0], posKey, ...p.slice(p[0] === '006' ? 4 : 3, p.length)];
    } else if (p[1] === 'subfields') {
      p = [p[0], `$${p[2]}`, ...p.slice(3, p.length)];
    }
    setWith(mapping, p.map((pSeg) => `${pSeg}`).join('.'), fieldObj, Object);
  }
});

const categoryEnum = Object.keys(
  schema.leader.positions.filter(({ start }) => (start === 6))[0].values,
).sort();
const definitions = {};

const reducePositions = (positions) => positions.reduce((acc, pp) => {
  const start = padLeft(pp.start, 2, '0');
  const stop = padLeft(pp.stop, 2, '0');
  const posKey = (start === stop) ? start : `${start}-${stop}`;

  if (Object.keys(pp.values || {}).length > 0) {
    const alternative = [];
    const e = {
      description: pp.name,
      type: 'string',
      enum: Object.keys(pp.values).sort(),
      enumDescription: Object.keys(pp.values).sort().map((k) => pp.values[k]),
    };

    [
      ['001-999', '^[0-9]{3}$'],
      ['1-9', '^[0-9]+$'],
      ['[aa#]', '^[a-zA-Z]{2}[# |]$'],
      ['[aaa]', '^[a-zA-Z]{3}$'],
      ['#', '^[# _]+$'],
      ['[number]', '[0-9]+'],
    ].forEach(
      ([val, pattern]) => {
        const idx = e.enum.indexOf(val);
        if (idx !== -1) {
          alternative.push({
            title: pp.values[val],
            type: 'string',
            pattern,
          });
          e.enum.splice(idx, 1);
          e.enumDescription.splice(idx, 1);
        }
      },
    );
    if (e.enum.length > 0) {
      alternative.push(e);
    }
    acc[posKey] = alternative.length > 1 ? { oneOf: alternative } : alternative[0];
  } else {
    acc[posKey] = {
      type: 'string',
      description: pp.name,
    };
  }
  return acc;
}, {});

Object.keys(schema['006'].positions).forEach((p) => {
  // mapping['006'] = pick(schema['006'], FIELDS);
  definitions[`006${p[3]}`] = {
    title: schema['006'].name,
    type: 'object',
    properties: reducePositions(schema['006'].positions[p]),
    additionalProperties: false,
  };
});
definitions['007'] = {
  oneOf: Object.keys(schema).sort().filter(
    (k) => k.substring(0, 3) === '007',
  ).map(
    (k) =>
      // mapping[k] = pick(schema[k], FIELDS);
      ({
        title: schema[k].name,
        type: 'object',
        properties: reducePositions(schema[k].positions),
        additionalProperties: false,
      })
    ,
  ),
};
categoryEnum.forEach((cat) => {
  // mapping[`008${cat}`] = pick(schema[`008${cat}`], FIELDS);
  definitions[`008${cat}`] = {
    type: 'object',
    title: schema[`008${cat}`] ? schema[`008${cat}`].name : schema['008'].name,
    additionalProperties: false,
    properties: reducePositions([
      ...(schema[`008${cat}`] ? schema[`008${cat}`].positions : []),
      ...schema['008'].positions.filter(({ start, stop }) => ((start === 18) && (stop === 34))),
    ]),
  };
});
categoryEnum.forEach((cat) => {
  // mapping[`leader${cat}`] = pick(schema[`leader${cat}`], FIELDS);
  definitions[`leader${cat}`] = {
    type: 'object',
    title: `${schema.leader} (${cat})`,
    properties: reducePositions(schema.leader.positions),
    additionalProperties: false,
  };
  definitions[`leader${cat}`].properties['06'] = {
    type: 'string',
    enum: [cat],
  };
});

Object.keys(schema).forEach(
  (tag) => {
    if (([
      '006',
      '007',
      '008',
      'leader',
    ].indexOf(tag) === -1) && tag.match(/^[0-9]{3}$/)) {
      // mapping[tag] = pick(schema[tag], FIELDS);
      const value = schema[tag];
      let fieldSchema = {
        type: 'string',
        ...(indicators[tag] || {}),
      };

      if (value.subfields && (Object.keys(value.subfields).length > 0)) {
        fieldSchema = {
          type: 'object',
          additionalProperties: false,
          properties: { ...(indicators[tag] || {}) },
        };
        mapValues(
          value.subfields,
          (sfSchema, subfieldName) => {
            fieldSchema.properties[`$${subfieldName}`] = {
              description: sfSchema.name,
              ...(sfSchema.repeatable ? {
                type: 'array',
                item: 'string',
              } : { type: 'string' }),
            };
          },
        );
      } else if (value.positions && (value.positions.length > 0)) {
        fieldSchema = {
          type: 'object',
          additionalProperties: false,
          properties: { ...reducePositions(value.positions), ...(indicators[tag] || {}) },
        };
      }

      definitions[tag] = {
        title: value.name,
        ...(
          value.repeatable
            ? {
              type: 'array',
              item: fieldSchema,
            }
            : fieldSchema
        ),
      };
    }
  },
);
definitions.other = {
  oneOf: [
    {
      type: 'array',
      item: {
        oneOf: [
          {
            type: 'object',
            properties: {
              ind1: {
                type: 'string',
              },
              ind2: {
                type: 'string',
              },
            },
            additionalProperties: {
              type: 'string',
            },
          },
          { type: 'string' },
        ],
      },
    },
    {
      type: 'object',
      properties: {
        ind1: {
          type: 'string',
        },
        ind2: {
          type: 'string',
        },
      },
      additionalProperties: {
        type: 'string',
      },
    },
    {
      type: 'string',
    },
  ],
};

const resultingSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `https://rsl.ru/schemas/rsl-marc21-bibliographic/${CONVERTOR_VERSION}/schema`,
  version: CONVERTOR_VERSION,
  title: 'MARC 21 Json schema from Russian State Library',
  oneOf: [],
  definitions,
};

categoryEnum.forEach((category) => {
  definitions[category] = {
    type: 'object',
    title: `Category: ${category}`,
    properties: {},
    additionalProperties: {
      $ref: '#/definitions/other',
    },
  };
  resultingSchema.oneOf.push({ $ref: `#/definitions/${category}` });
  uniq(
    Object.keys(schema).sort().filter(
      (k) => k.match(/leader|[0-9]{3}/),
    ).map(
      (d) => (d.startsWith('leader') ? 'leader' : d.substr(0, 3)),
    ),
  )
    .sort()
    .map(
      (tag) => {
        definitions[category].properties[tag] = {
          // eslint-disable-next-line no-nested-ternary
          $ref: definitions[tag + category]
            ? `#/definitions/${tag + category}`
            : (definitions[tag] ? `#/definitions/${tag}` : '#/definitions/other'),
        };
      },
    );
});

process.stderr.write(`${SCHEMA_PATH}  ->  ${JSON_PATH}\n`);
const jsonSchema = JSON.stringify(resultingSchema, null, 2);
mkdirpSync(path.dirname(JSON_PATH));
fs.writeFileSync(JSON_PATH, jsonSchema, 'utf8');

process.stderr.write(`${SCHEMA_PATH}  ->  ${YAML_PATH}\n`);
const yamlSchema = jsyaml.safeDump(JSON.parse(jsonSchema), { sortKeys: true });
mkdirpSync(path.dirname(YAML_PATH));
fs.writeFileSync(YAML_PATH, yamlSchema, 'utf8');
