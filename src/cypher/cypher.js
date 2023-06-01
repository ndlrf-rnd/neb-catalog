const intersection = require('lodash.intersection');
const cypher = require('cypher-parser');
const { sanitizeEntityKind } = require('../utils');
const { jsonStringifySafe, mapValues } = require('../utils');
const { describeTables } = require('../dao/db-lifecycle');
const { debug, flatten, omit, cpMap, flattenDeep, forceArray, compact } = require('../utils');
const { ANCHOR_NAME, RELATION_NAME } = require('../dao/queries');

// 0 <--
const DIRECTION_INBOUND = 0;
// 1 -->
const DIRECTION_OUTBOUND = 1;
// 2 --
const DIRECTION_BIDIRECTIONAL = 2;

const expandPaths = async (pattern, relations, entities) => {
  const nodes = pattern.filter(
    el => (el.type === 'node-pattern'),
  );
  const stacks = nodes.reduce(
    (ss, el, idx) => {
      const prevStack = ss.slice(-1)[0];
      const labels = forceArray(el.labels).map(({ name }) => name);
      const zeroLabels = (labels.length > 0) ? intersection(labels, entities) : entities;
      return [
        ...ss,
        (idx === 0)
          ? zeroLabels
          : prevStack.reduce(
          (aa, s) => {
            const prevLabel = compact(s.split('.')).slice(-1)[0];
            const validRels = relations[prevLabel] || [];
            return [
              ...aa,
              ...(validRels).map(r => `${s}..${r}`),
            ];
          },
          [],
          ),
      ];
    },
    [],
  ).slice(1).reduce((a, o) => ([...a, ...o]), []);
  return stacks.map(
    stack => stack.split('.').map(
      (label, idx) => label ? ({
        ...omit(pattern[idx], ['labels']),
        label,
      }) : omit(pattern[idx], ['labels']),
    ),
  );
};

const propertiesToSql = (table, properties) => properties && (properties.type === 'map')
  ? Object.keys(properties.entries).map(
    (k) => {
      const v = properties.entries[k];
      const quote = v.type === 'string' ? `'` : '';
      return `${table}.${k}=${quote}${v.value}${quote}`;
    },
  ).filter(v => v.trim().length > 0).join(' AND ')
  : '';

const processNode = ({ labels, properties, identifier }) => labels.map(
  label => ({
    kind: sanitizeEntityKind(label.name),
    key: identifier.name,
    ...mapValues(
      properties.entries,
      ({ value }) => value,
    ),
  }),
  // const tableName = ANCHOR_NAME(label.name);
  // const cs = new PGP.helpers.ColumnSet(
  //   Object.keys(properties.entries).sort(),
  //   { table: tableName },
  // );
  // const insertValues = PGP.helpers.values(forceArray(values), cs);
  // return `INSERT INTO ${tableName} AS ${identifier.name} (${cs.names})
  //   VALUES (${insertValues})`;
);
const parseMergePatternPath = async ({ elements }, relations, entities) => {
  const processedNodes = elements.map(
    el => (el.type === 'node-pattern')
      ? processNode(el)
      : null,
  );
  return flattenDeep(
    elements.map(
      (el, idx) => {
        if (el.type === 'node-pattern') {
          return [processedNodes[idx]];
        } else if (el.type === 'rel-pattern') {
          const aArr = processedNodes[idx - 1];
          const bArr = processedNodes[idx + 1];
          if (el.reltypes) {


            const inbound = flatten(aArr.map(
              a => bArr.map(
                b => ({
                  source_from: b.source,
                  kind_from: b.kind,
                  key_from: b.key,

                  source_to: a.source,
                  kind_to: a.kind,
                  key_to: a.key,
                }),
              ),
            ));
            const outbound = flatten(bArr.map(
              b => aArr.map(
                a => ({
                  source_from: a.source,
                  kind_from: a.kind,
                  key_from: a.key,

                  source_to: b.source,
                  kind_to: b.kind,
                  key_to: b.key,
                }),
              ),
            ));

            if (el.direction === DIRECTION_INBOUND) {
              return el.reltypes.map(({ name }) => inbound.map(v => ({
                ...v,
                relation_kind: sanitizeEntityKind(name),
              })));
            } else if (el.direction === DIRECTION_OUTBOUND) {
              return el.reltypes.map(
                ({ name }) => outbound.map(v => ({
                  ...v,
                  relation_kind: sanitizeEntityKind(name),
                })),
              );
            } else if (el.direction === DIRECTION_BIDIRECTIONAL) {
              return el.reltypes.map(
                ({ name }) => [
                  ...inbound,
                  ...outbound,
                ].map(
                  v => ({
                    ...v,
                    relation_kind: sanitizeEntityKind(name),
                  }),
                ),
              );
            }
          } else {
            // no reltypes
            return [];
          }
        } else {
          return null;
        }
      },
    ),
  );
};

const parseMatchPatternPath = async ({ elements }, relations, entities) => {
  const ps = await expandPaths(elements, relations, entities);
  return ps.map((atomicPath, psIdx) => {
    const tt = ANCHOR_NAME(atomicPath[0].label);
    const tta = `_${psIdx}_0__${tt}`;
    const condition = compact(atomicPath.map(
      ({ properties, label, type }, idx) => (type === 'node-pattern') && properties && label
        ? propertiesToSql(`_${psIdx}_${idx}__${ANCHOR_NAME(label)}`, properties)
        : null,
    )).join('\nAND\n');
    const rels = compact(atomicPath.map(
      (el, idx) => {
        if (el.type === 'node-pattern') {
          if ((0 < idx) && (idx < atomicPath.length)) {
            const tr1 = RELATION_NAME(atomicPath[idx - 2].label, atomicPath[idx].label);
            const tra1 = `_${psIdx}_${idx - 2}__${tr1}`;

            const tt1 = ANCHOR_NAME(atomicPath[idx - 2].label);
            const tta1 = `_${psIdx}_${idx - 2}__${tt1}`;

            const tt2 = ANCHOR_NAME(atomicPath[idx].label);
            const tta2 = `_${psIdx}_${idx}__${tt2}`;

            return [
              `INNER JOIN ${tr1} AS ${tra1} ON ${tta1}.key = ${tra1}.key_from AND ${tta1}.source = ${tra1}.source_from`,
              `INNER JOIN ${tt2} AS ${tta2} ON ${tra1}.key_to = ${tta2}.key AND ${tra1}.source_to = ${tta2}.source`,
            ].join('\n');
          }
        }
      },
    ));
    const kindFrom = atomicPath[atomicPath.length - 3].label;
    const kindTo = atomicPath[atomicPath.length - 1].label;
    const tr1 = RELATION_NAME(atomicPath[atomicPath.length - 3].label, atomicPath[atomicPath.length - 1].label);
    const tra1 = `_${psIdx}_${atomicPath.length - 3}__${tr1}`;
    return [
      `SELECT`,
      `'${kindFrom}' as kind_from, ${tra1}.source_from, ${tra1}.key_from,`,
      `'${kindTo}' as kind_to, ${tra1}.source_to, ${tra1}.key_to`,
      `FROM ${tt} AS ${tta}`,
      ...rels,
      condition ? `WHERE ${condition}` : '',
    ].join('\n');
  }).join('\nUNION\n') + ';\n';
};

// const parsePath = async (path, relations, entities) => {
//   const { type, elements } = path;
//   if (type === 'pattern-path') {
//     return parseMatchPatternPath(path, relations, entities);
//   } else {
//     return `SQL_PATTERN_PATH[${type}]${JSON.stringify(path)}`;
//   }
// };
const parseProjection = async (projection, relations, entities) => {

  return ``;//SQL_PROJECTION[${projection.type}](${JSON.stringify(projection)})\n`;
};

const parseQueryClause = async (clause, relations, entities) => {
  const { type, projections, path, pattern } = clause;
  if (type === 'merge') {
    if (path.type === 'pattern-path') {
      return parseMergePatternPath(path, relations, entities);
    } else {
      return `SQL_PATTERN_PATH[${type}]${JSON.stringify(path)}\n`;
    }
  } else if (type === 'match') {
    return cpMap(
      pattern.paths,
      async path => {
        const { type, elements } = path;
        if (type === 'pattern-path') {
          return parseMatchPatternPath(path, relations, entities);
        } else {
          return `SQL_PATTERN_PATH[${type}]${JSON.stringify(path)}\n`;
        }
      },
    );
  } else {
    return cpMap(projections, projection => parseProjection(projection, relations, entities));
  }
};

const parseStatementBody = async (statementBody, relations, entities) => {
  const { type, clauses } = statementBody;
  if (type === 'query') {
    return cpMap(
      clauses,
      clause => parseQueryClause(clause, relations, entities),
    );
  } else {
    return `SQL[${type}](${JSON.stringify(statementBody)});\n`;
  }
};

const query = async (queryStr) => {
  let parseResult;
  try {
    parseResult = await cypher.parse({
      query: queryStr,
      dumpAst: false,
      colorize: true,
    });
    debug('Parsed Cypher directives:', jsonStringifySafe(parseResult.directives));
    debug('Parsed Cypher roots:', jsonStringifySafe(parseResult.roots));
  } catch (e) {
    // error(e);
    for (let i = 0; i < e.parseResult.errors.length; i++) {
      let error = e.parseResult[i];
      if (error) {
        debug((error && error.position ? error.position.line + ':' + error.position.column + ': ' : '') + error.message);
        debug(error.context);
        debug(' '.repeat(error.contextOffset) + '^');
        debug(e.parseResult.ast);
      }
    }
    throw (e);
  }
  const { roots, errors, directives } = parseResult;

  const { anchors, details, relations } = await describeTables();
  return flattenDeep(
    await cpMap(
      forceArray(directives),
      async directive => {
        const { type, body } = directive;
        if (type === 'statement') {
          const rels = forceArray(relations).reduce((a, { kinds }) => ({
            ...a,
            [kinds[0]]: [...(a[kinds[0]] || []), kinds[1]],
            // [kind[1]]: [...(a[kind[1]] || []), kind[0]],
          }), {});
          const kinds = Object.values(details ||{}).map(({ kind }) => kind).sort();
          return parseStatementBody(
            body,
            rels,
            kinds,
          );
        } else {
          return 'SQL_DIRECTIVE(' + JSON.stringify(directive) + ');\n';
        }
      },
    ),
  );
  //.filter(v=>`${v||''}`.trim().length > 0).map(v=>`${`${v || ''}`.trim()}\n`);
}

const parseCypher = (input) => {
  const entities = [];
  let relations = [];
  const queries = input.split(';').filter(v=>v.trim().length > 0);
  queries.map((query) => {
    const matches = query.matchAll(/\(([^ ]+) ([^)]*)\)(?:([<]?-)\[([^\]]+)\](-[>]))?/uig);
    [...matches].forEach((r) => {
      const entity = {
        kind: r[1],
        ...JSON.parse(r[2]),
      };
      if (relations.length > 0) {
        relations = relations.map((rel) => ({
          key_from: entity.key,
          source_from: entity.source,
          kind_from: entity.kind,
          key_to: entity.key,
          source_to: entity.source,
          kind_to: entity.kind,
          ...rel,
        }));
      }

      entities.push(entity);

      if (r[4]) {
        const from = r[3] === '<-';
        const to = r[5] === '->';
        if (from) {
          relations.push({
            key_to: entity.key,
            source_to: entity.source,
            kind_to: entity.kind,
            relation_kind: r[4],
          });
        }
        if (to) {
          relations.push({
            key_from: entity.key,
            source_from: entity.source,
            kind_from: entity.kind,
            relation_kind: r[4],
          });
        }
      }
    });
  });
  return {
    entities,
    relations,
  };
};

module.exports = {
  query,
  parseCypher,
};
