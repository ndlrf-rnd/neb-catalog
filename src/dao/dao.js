const pgPromise = require('pg-promise');
const { mapValues } = require('../utils');
const { ORDER_DESC } = require('../constants');
const { tsToPostgre } = require('../utils');
const {
  difference,
  defaults,
  error,
  cpMap,
  forceArray,
  flatten,
  flattenDeep,
  uniq,
  warn,
  debug,
  omitEmpty,
  isEmpty,
  isObject,
  sanitizeEntityKind,
  uniqBy,
  tsToPg,
} = require('../utils');
const { getDb, describeTables, describeDbEntities } = require('./db-lifecycle');
const { hash } = require('../crypto/siphash');

const {
  DETAIL_TABLE_PREFIX,
  RELATION_TABLE_PREFIX,
  COUNT_PREFIX,
  PKEY_SUFFIX,
  ANCHOR_TABLE_PREFIX,
  DEFAULT_QUERY_OPTIONS,
  T_PROVIDERS,
  T_SOURCES,
  DEFAULT_RELATION_KIND,
} = require('./constants');
const { ORDER_DEFAULT } = require('../constants');

const {
  ANCHOR_NAME,
  ENTITY,
  ENTITY_NAME,
  RELATION,
  RELATION_NAME,
} = require('./queries');

// Init PGP
const PGP_INIT_OPTIONS = {
  error: (err) => {
    error('Unexpected error on idle client', err);
    process.exit(-1);
  },
};

let PGP = pgPromise(PGP_INIT_OPTIONS);

global.SOURCES_DICT = {};
global.PROVIDERS_DICT = {};
global.COLUMN_SETS = {};

const COLUMNS_SOURCES = new PGP.helpers.ColumnSet(
  ['code', 'metadata'],
  { table: T_SOURCES },
);

const COLUMNS_PROVIDERS = new PGP.helpers.ColumnSet(
  ['code', 'metadata'],
  { table: T_PROVIDERS },
);

const COLUMNS_ANCHORS = [
  'source',
  'key',
];

const COLUMNS_DETAILS = [
  'source',
  'key',
  {
    name: 'record',
    cast: 'text',
  },
  'record_hash',
  'provider',
  'media_type',
  {
    name: 'time_source',
    cast: 'TIMESTAMP',
  },
  {
    name: 'time_sys',
    cast: 'TIMESTAMP',
  },
];

const COLUMNS_RELATIONS = [
  'source_from',
  'key_from',
  'relation_kind',
  'source_to',
  'key_to',
  'provider',
];

/**
 *
 * @param tableName
 * @returns {*}
 */
const getAnchorColumns = (tableName) => {

  if (!global.COLUMN_SETS[tableName]) {
    global.COLUMN_SETS[tableName] = new PGP.helpers.ColumnSet(
      COLUMNS_ANCHORS,
      { table: tableName },
    );
  }
  return global.COLUMN_SETS[tableName];
};

/**
 *
 * @param tableName
 * @returns {*}
 */
const getDetailColumns = (tableName) => {
  if (!global.COLUMN_SETS[tableName]) {
    global.COLUMN_SETS[tableName] = new PGP.helpers.ColumnSet(
      COLUMNS_DETAILS,
      { table: tableName },
    );
  }
  return global.COLUMN_SETS[tableName];
};

/**
 *
 * @param tableName
 * @returns {*}
 */
const getRelationsColumns = (tableName) => {
  if (!global.COLUMN_SETS[tableName]) {
    global.COLUMN_SETS[tableName] = new PGP.helpers.ColumnSet(
      COLUMNS_RELATIONS,
      { table: tableName },
    );
  }
  return global.COLUMN_SETS[tableName];
};


const countAllAnchors = async () => {
  const db = await getDb();
  return parseInt((await db.one(
    `SELECT SUM(pg_stat_user_tables.n_live_tup) AS count FROM pg_stat_user_tables WHERE relname LIKE '${ANCHOR_TABLE_PREFIX.replace(/_/g, '\\_')}%';`,
  )).count, 10);
};

const countAnchors = async (kind, source, key) => {
  if (key) {
    return 1;
  }
  kind = sanitizeEntityKind(kind);
  const dbEntities = await describeDbEntities();
  if (typeof dbEntities[kind] === 'undefined') {
    return 0;
  }
  const db = await getDb();
  const q = source
    ? `SELECT COUNT(*) AS count FROM ${ANCHOR_NAME(kind)} WHERE source=$<source>`
    : `SELECT COUNT(*) AS count FROM ${ANCHOR_NAME(kind)}`;
  // : `SELECT pg_stat_user_tables.n_live_tup AS count FROM pg_stat_user_tables WHERE relname = $<kind>;`;
  const res = await db.oneOrNone(q, {
    kind,
    source,
  });
  if (res) {
    return parseInt(res.count, 10);
  } else {
    return 0;
  }
};

/**
 * Basic operations
 */
const query = async (type, q, valuesArr) => (await getDb()).tx(
  (tx) => tx.batch(
    (valuesArr || []).map(
      (values) => tx[type](q, values),
    ),
  ),
);

/**
 *
 * @param requiredRelations
 * @returns {Promise<{}>}
 */
const whichTablesAreMissing = async (requiredRelations) => {
  const existingTablesObj = await describeTables(true);
  const existingTables = {};
  Object.keys(existingTablesObj).sort().forEach(tk => {
    existingTables[tk] = Object.keys(existingTablesObj[tk]).sort().map(k => existingTablesObj[tk][k].table);
  });
  return Object.keys(requiredRelations).sort().reduce(
    (acc, tableClass) => {
      const diff = difference(
        requiredRelations[tableClass] || [],
        existingTables[tableClass] || [],
      );
      if (diff.length > 0) {
        return {
          ...acc,
          [tableClass]: diff,
        };
      } else {
        return acc;
      }
    },
    {},
  );
};

/**
 * sumNestedLen({a: [1,2], b: [3,4,5]}:)
 * / => 5
 * @param obj {Object<Array>}
 * @returns {number}
 */
const sumNestedLen = (obj) => Object.keys(obj).reduce(
  (acc, k) => acc + forceArray(obj[k]).length,
  0,
);

/**
 * Ensure relation existence
 * @returns {Promise<*[]>}
 * @param tables
 * @param onProgress
 */
const ensureTables = async (tables, onProgress) => {
  const totalCount = sumNestedLen(tables);

  const db = await getDb();
  if (onProgress) {
    await onProgress({
      documents_estimated: totalCount,
      documents_completed: 0,
    });
  }

  const missingTables = await whichTablesAreMissing(tables);
  const missingCount = sumNestedLen(missingTables);
  if (onProgress) {
    await onProgress({
      documents_estimated: missingCount,
      documents_completed: totalCount - missingCount,
    });
  }
  try {
    if (missingCount > 0) {
      const missingEntities = flattenDeep(uniq(
        flattenDeep(
          flattenDeep([
            missingTables.details,
            missingTables.anchors,
          ]).filter(e => !!e).map(
            r => r.split(/__/uig).slice(1),
          ),
        ),
      )).sort().filter(v => !!v).map(
        tableName => ENTITY(tableName),
      );
      if (missingEntities.length > 0) {
        debug(`Creating etities tables:\n${missingEntities.join('\n')}`);
        await db.oneOrNone(missingEntities.join('\n'));
      }
      if (forceArray(missingTables.relations).map(v => v.trim()).length > 0) {
        await cpMap(
          forceArray(missingTables.relations).map(v => v.trim()),
          async tableName => {
            const missingRelations = flattenDeep(
              [
                uniq(tableName.split('__').slice(1)).sort().filter(v => !!v).map(v => ENTITY(v)),
                RELATION(tableName),
              ],
            );
            if (missingRelations.length > 0) {

              warn(`Creating relation tables:\n${missingRelations.join('\n')}`);
              try {
                await db.oneOrNone(missingRelations.join('\n'));
              } catch (e) {
                warn(e);
                await describeDbEntities(false);
              }
            }
          },
        );
      }
    }
  } catch (e) {
    warn('Error during creation tables on fly:', e);
  }
  return tables;
};

const updateSources = async (inputSources, db) => {
  db = db || (await getDb());
  inputSources = forceArray(inputSources);
  const sources = uniq(inputSources).sort().filter(
    (source) => (!isEmpty(source)) && isEmpty(global.SOURCES_DICT[source]),
  ).map((code) => ({
    code,
    metadata: { comment: 'autogen' },
  }));

  if (sources.length > 0) {
    const values = PGP.helpers.insert(sources, COLUMNS_SOURCES);
    const res = await db.manyOrNone(`${values} ON CONFLICT(code) DO NOTHING RETURNING code;`);
    sources.forEach((source) => {
      global.SOURCES_DICT[source.code] = true;
    });
    return {
      total: inputSources.length,
      affected: res.length,
      new: sources.map(({ code }) => code),
    };
  }
  return {
    total: inputSources.length,
    affected: 0,
    new: [],
  };
};

const updateProviders = async (inputProviders, db) => {
  db = db || (await getDb());
  inputProviders = forceArray(inputProviders);
  const providers = uniq(
    inputProviders,
  ).filter(
    (provider) => (!isEmpty(provider)) && isEmpty(global.PROVIDERS_DICT[provider]),
  ).sort().map(
    (code) => ({
      code,
      metadata: { comment: 'autogen' },
    }),
  );

  if (providers.length > 0) {
    const values = PGP.helpers.insert(providers, COLUMNS_PROVIDERS);
    const res = await db.manyOrNone(`${values} ON CONFLICT(code) DO NOTHING RETURNING code;`);
    providers.forEach((provider) => {
      global.PROVIDERS_DICT[provider] = true;
    });
    return {
      total: inputProviders.length,
      affected: res.length,
      new: res.map(({ code }) => code),
    };
  }
  return {
    total: inputProviders.length,
    affected: 0,
    new: [],
  };
};

const insertAnchorsQuery = (tableName, anchors) => {
  debug(`Planning to create ${anchors.length} (or less) anchors`);
  const cs = getAnchorColumns(tableName);
  if (forceArray(anchors).length > 0) {
    return `
    WITH v (${cs.names})
      AS (VALUES ${PGP.helpers.values(forceArray(anchors).map(sanitizeEntityFields).filter(rec => !!rec), cs)})
    INSERT INTO ${tableName}
      (${cs.names})
      (
        SELECT v.source, v.key
        FROM v
        LEFT JOIN ${tableName} r ON
          r.source = v.source
          AND 
          r.key = v.key
        WHERE
          r.source IS NULL
          OR 
          r.key IS NULL
    )
    ON CONFLICT ON CONSTRAINT ${tableName}${PKEY_SUFFIX}
    DO NOTHING
    RETURNING *;`;
  }
  return '';
};

const insertDetailsQuery = (tableName, details) => {
  debug(`Planning to create ${details.length} (or less) entity detail records`);
  if (forceArray(details).length > 0) {
    const cs = getDetailColumns(tableName);
    const values = PGP.helpers.values(forceArray(details).map(sanitizeEntityFields), cs);
    return `
        WITH v (${cs.names})
        AS (VALUES ${values})
        INSERT INTO ${tableName}
          (${cs.names})
          (
            SELECT
              v.source,
              v.key,
              v.record,
              v.record_hash::UUID,
              v.provider,
              v.media_type,
              v.time_source,
              v.time_sys
            FROM v
            LEFT JOIN ${tableName} r ON
              r.source = v.source
              AND 
              r.provider = v.provider
              AND 
              r.key = v.key
              AND r.record_hash::UUID = v.record_hash::UUID
            WHERE
              r.source IS NULL
              OR r.provider IS NULL
              OR r.key IS NULL
              OR r.record_hash IS NULL
          )
          -- Only highest margin will be updated
          ON CONFLICT ON CONSTRAINT ${tableName}${PKEY_SUFFIX}
          DO NOTHING
          ;`;
  }
  return '';
};

const getAllRelations = async (useCache = true) => mapValues(
  await describeDbEntities(useCache),
  (rec) => ({
    incoming: Object.keys(rec.incoming || {}).sort(),
    outgoing: Object.keys(rec.outgoing || {}).sort(),
  }),
);

/**
 *
 * @param options
 * @param useCache
 * @returns {Promise<Array>}
 */
const queryEntities = async (options = DEFAULT_QUERY_OPTIONS, useCache = false) => {
  let {
    nodes,
    after,
    limit,
    since,
    until,
    // order,
  } = defaults(options, DEFAULT_QUERY_OPTIONS);
  const afterArr = forceArray(typeof after === 'string' ? after.split('-') : after);
  const afterSerial = afterArr.length > 0 ? parseInt(afterArr[afterArr.length - 1]) : null;

  const order = ORDER_DESC;//(order || ORDER_DEFAULT).toLocaleUpperCase();
  const isOrderDesc = order.toLocaleUpperCase() === ORDER_DESC.toLocaleUpperCase();

  until = until ? tsToPg(until) : null;
  since = since ? tsToPg(since) : null;
  limit = limit || DEFAULT_QUERY_OPTIONS.limit;
  const dbEntities = await describeDbEntities(useCache);
  const groupedNodes = (nodes || []).reduce(
    (a, o) => {
      const clean = omitEmpty(o);
      const kind = sanitizeEntityKind(o.kind);
      if ((typeof dbEntities[kind] === 'undefined') || (Object.keys(clean).length === 0) || (!clean.source)) {
        return {
          ...a,
          [kind]: [],
        };
      }
      return {
        ...a,
        [kind]: [...forceArray(a[kind]), clean],
      };
    },
    {},
  );
  if (Object.keys(groupedNodes).length === 0) {
    return [];
  }
  const db = await getDb();
  return uniqBy(
    flattenDeep(
      await cpMap(
        Object.keys(groupedNodes).sort(),
        async (kind) => {
          if (typeof groupedNodes[kind] === 'undefined') {
            return [];
          }
          const haveKeys = groupedNodes[kind].filter(v => !!v.key).length > 0;
          const haveSources = groupedNodes[kind].filter(v => !!v.source).length > 0;

          const eTable = ENTITY_NAME(kind);
          const filteredNodes = groupedNodes[kind].filter(
            ({ key }) => (!haveKeys) || (key && (key.trim().length > 0)),
          );
          const where = [
            afterSerial // If explicit keys defined no after filter will be used
              ? `${eTable}.serial ${isOrderDesc ? '<' : '>'} $<afterSerial>`
              : null,
            (haveSources
              ? `(${eTable}.source ${haveKeys ? `, ${eTable}.key` : ''}) IN (${
                filteredNodes.map(
                  ({ source, key }) => `(${
                    [source, key].filter(v => !!v).map(v => `'${v.trim().toLocaleLowerCase()}'`).join(',')
                  })`,
                ).join(', ')
              })`
              : null),
            (since ? `${eTable}.time_sys >= $<since>` : null),
            (until ? `${eTable}.time_sys <= $<until>` : null),
          ].filter(v => !!v).map(v => `(${v})`).join(' AND ');

          const qSelect = `
      SELECT ${eTable}.*
      FROM ${eTable}
      ${where ? ` WHERE ${where} ` : ''}
      ORDER BY ${eTable}.serial ${order}
      LIMIT $<limit>;`;
          const qVars = {
            limit,
            since,
            until,
            afterSerial,
          };
          const dbResult = forceArray(await db.manyOrNone(qSelect, qVars));
          return dbResult.map(rec => ({
            ...rec,
            kind,
            mediaType: rec.media_type,
          }));
        },
      )),
    oo => [oo.kind, oo.source, oo.key].join('\t'),
  );
};

/**
 *
 * @param options
 * @param useCache
 * @returns {Promise<Array>}
 */
const queryAnchors = async (options = DEFAULT_QUERY_OPTIONS, useCache = true) => {
  let {
    nodes,
    after,
    limit,
    since,
    until,
    // order,
  } = defaults(options, DEFAULT_QUERY_OPTIONS);
  const afterArr = forceArray(typeof after === 'string' ? after.split('-') : after);
  const afterSerial = afterArr.length > 0 ? afterArr[afterArr.length - 1] : null;
  const db = await getDb();

  // const order = (order || ORDER_DEFAULT).toLocaleUpperCase();
  const order = ORDER_DESC;
  const isOrderDesc = order.toLocaleUpperCase() === ORDER_DESC.toLocaleUpperCase();

  until = until ? tsToPg(until) : null;
  since = since ? tsToPg(since) : null;
  limit = limit || DEFAULT_QUERY_OPTIONS.limit;
  const groupedNodes = (nodes || []).reduce(
    (a, o) => {
      const clean = omitEmpty(o);
      const kind = sanitizeEntityKind(o.kind);
      if ((!kind) || (Object.keys(clean).length === 0) || (!clean.source)) {
        return {
          ...a,
          [kind]: (a[kind] || []),
        };
      }
      return {
        ...a,
        [kind]: [...(a[kind] || []), clean],
      };
    },
    {},
  );
  if (Object.keys(groupedNodes).length === 0) {
    return [];
  }
  const dbEntities = await describeDbEntities(useCache);
  return uniqBy(
    flattenDeep(
      await cpMap(
        Object.keys(groupedNodes).sort(),
        async (kind) => {
          if (typeof dbEntities[kind] === 'undefined') {
            return [];
          }
          const haveKeys = groupedNodes[kind].filter(v => !!v.key).length > 0;
          const haveSources = groupedNodes[kind].filter(v => !!v.source).length > 0;

          const aTable = ANCHOR_NAME(kind);
          const filteredNodes = groupedNodes[kind].filter(
            ({ key }) => (!haveKeys) || (key && (key.trim().length > 0)),
          );

          const where = [
            afterSerial
              ? `${aTable}.serial ${isOrderDesc ? '<' : '>'} $<afterSerial>`
              : null,
            (haveSources
              ? `(${aTable}.source ${haveKeys ? `, ${aTable}.key` : ''}) IN (${
                filteredNodes.map(
                  ({ source, key }) => `(${
                    [source, key].filter(v => !!v).map(v => `'${v.trim().toLocaleLowerCase()}'`).join(',')
                  })`,
                ).join(', ')
              })`
              : null),
            (since ? `${aTable}.time_sys >= $<since>` : null),
            (until ? `${aTable}.time_sys <= $<until>` : null),
          ].filter(v => !!v).map(v => `(${v})`).join(' AND ');

          const qSelect = `
      SELECT ${aTable}.*
      FROM ${aTable}
      ${where ? ` WHERE ${where} ` : ''}
      ORDER BY ${aTable}.serial ${order}
      LIMIT $<limit>;`;
          const qVars = {
            limit,
            since,
            until,
            afterSerial,
          };
          const dbResult = forceArray(await db.manyOrNone(qSelect, qVars));
          return dbResult.map(rec => ({
            ...rec,
            kind,
          }));
        },
      )),
    oo => [oo.kind, oo.source, oo.key].join('\t'),
  );
};

/*
FIXME!
SELECT COUNT(*) as count, _r__collection__item.key_from as key, _r__collection__item.source_from as source
FROM _r__collection__item
WHERE (_r__collection__item.source_to = 'knpam.rusneb.ru')
  and (_r__collection__item.key_to in ('14534', '9885', '14536'))
group by (_r__collection__item.key_from, _r__collection__item.source_from)
 */
const countRelations = async (nodes, directions) => {
  const { incoming, outgoing } = defaults(directions, {
    incoming: false,
    outgoing: true,
  });
  if (nodes.length === 0) {
    return [];
  }
  const db = await getDb();

  const allRels = await getAllRelations();
  const vars = {};
  const relQueries = flattenDeep(forceArray(nodes).map((p, idx) => {

    const { kind, source, key } = (p || {});
    const rels = allRels[kind];
    vars[`source_${idx}`] = source;
    vars[`key_${idx}`] = key;
    vars[`${idx}`] = idx;
    const relQueries = flattenDeep([
      ...(outgoing ? rels.outgoing.map(toKind => `(
        SELECT COUNT(*) FROM ${RELATION_NAME(kind, toKind)}
        ${source ? `WHERE (${RELATION_NAME(kind, toKind)}.source_from = $<source_${idx}>)` : ''}
        ${source && key ? `AND (${RELATION_NAME(kind, toKind)}.key_from = $<key_${idx}>)` : ''}
      )`) : []),
      ...(incoming ? rels.incoming.map(fromKind => `(
        SELECT COUNT(*) FROM ${RELATION_NAME(fromKind, kind)}
        ${source ? `WHERE (${RELATION_NAME(fromKind, kind)}.source_to = $<source_${idx}>)` : ''}
        ${source && key ? `AND (${RELATION_NAME(fromKind, kind)}.key_to = $<key_${idx}>)` : ''}
      )`) : []),
    ]);
    return relQueries.length ? `SELECT ${idx} AS idx, ${relQueries.join('\n + \n')} as total` : null;
  })).filter(v => !!v);
  if (relQueries.length === 0) {
    return [];
  }
  const q = relQueries.map(qq => `(${qq})`).join('\n UNION \n');
  return forceArray(await db.manyOrNone(q, vars)).map(
    ({ total }) => parseInt(total, 10),
  );
};


// TODO: FIXME: IMPORTANT! SECURITY! Add entity names screening everywhere
const lookupRelations = async (ctx, useCache = false) => {
  ctx = defaults(ctx, {
    incoming: true,
    outgoing: true,
    order: ORDER_DEFAULT.toLocaleUpperCase(),
  });
  const { nodes, limit, offset, after } = ctx;
  const afterArr = forceArray(typeof after === 'string' ? after.split('-') : after);
  const afterSerial = afterArr.length > 0 ? afterArr[afterArr.length - 1] : null;
  const afterRel = afterArr.length > 0 ? afterArr.slice(0, afterArr.length - 1) : null;
  const isOrderDesc = true;
  const groupedNodes = forceArray(nodes).reduce((a, o) => ({
    ...a,
    [o.kind]: [
      ...(a[o.kind] || []),
      omitEmpty(o),
    ],
  }), {});
  const db = await getDb();
  const entities = await describeDbEntities(useCache);

  return flattenDeep(
    await cpMap(
      Object.keys(groupedNodes).sort(),
      async (kind) => {
        if (typeof entities[kind] === 'undefined') {
          error(`No entities of kind ${kind}`);
          return [];
        }
        const rels = (await getAllRelations())[kind];
        let relations = uniq([
          ...forceArray(rels.incoming).map(r => [r, kind].join('-')),
          ...forceArray(rels.outgoing).map(r => [kind, r].join('-')),
        ]).sort();
        if (afterRel) {
          const rel = afterArr.slice(0, -1).join('-');
          const relId = relations.indexOf(rel);
          relations = relations.slice(relId === -1 ? 0 : relId);
        }

        if (relations.length === 0) {
          return [];
        }
        // Relations of same kind of entity like collection-collection may be queried twice
        const outgoingRelationKinds = relations.filter(r => r.split('-')[0] === kind).map(r => r.split('-')[1]);
        const incomingRelationKinds = relations.filter(r => r.split('-')[1] === kind).map(r => r.split('-')[0]);
        const slf = ANCHOR_NAME(kind);
        const haveKeys = groupedNodes[kind].filter(v => !!v.key).length > 0;
        const haveSources = groupedNodes[kind].filter(v => !!v.source).length > 0;
        const where = haveSources
          ? `WHERE (${
            [
              ...[`${slf}.source`],
              ...(haveKeys ? [`${slf}.key`] : []),
            ].join(',')
          }) IN (${
            groupedNodes[kind].map(
              ({ source, key }) => `(${[source, key].map(v => `'${v}'`).join(',')})`,
            ).join(', ')
          })`
          : '';
        const recordsQuery = ` WITH records AS (
          SELECT
            '${kind}'       AS kind,
            ${slf}.source   AS source,
            ${slf}.key      AS key,
            'self'          AS direction,
            'self'          AS relation_kind,
            'time_sys'      AS time_sys,
            'time_source'   AS time_source
            FROM ${slf}
            ${where}
        ) `;
        const outgoingSql = outgoingRelationKinds.map(
          (ok) => {
            const r = RELATION_NAME(kind, ok);
            const whereAfter = afterSerial && (afterArr[1] === ok)
              ? `${r}.serial ${isOrderDesc ? '<' : '>'} $<afterSerial>`
              : null;
            return `
            SELECT
              '${ok}' AS kind_to,
              '${kind}' AS kind_from,
              ${r}.*,
              'from' AS direction
            FROM ${r}
            RIGHT JOIN records ON ${r}.key_from = records.key AND ${r}.source_from = records.source
            WHERE 
              ${r}.source_from IS NOT NULL 
              AND
              ${r}.key_from IS NOT NULL
              AND
              ${r}.source_to IS NOT NULL
              AND
              ${r}.key_to IS NOT NULL
              ${whereAfter ? `AND ${whereAfter}` : ''}
              ${ok === kind ? `AND ((${r}.key_from != ${r}.key_to) OR (${r}.source_from != ${r}.source_to))` : ''}
            ORDER BY ${r}.serial ${isOrderDesc ? 'DESC' : 'ASC'}
            ${limit ? `LIMIT $<limit>` : ''}
            `;
          },
        );

        const incomingSql = incomingRelationKinds.map(
          (ik) => {
            const r = RELATION_NAME(ik, kind);
            const whereAfter = afterSerial && (afterArr[0] === ik) ? `${r}.serial ${isOrderDesc ? '<' : '>'} $<afterSerial>` : null;
            return `
              SELECT
                '${ik}' AS kind_from,
                '${kind}' AS kind_to,
                ${r}.*,
                'to' AS direction
              FROM ${r}
                RIGHT JOIN records ON ${r}.key_to = records.key AND ${r}.source_to = records.source
                WHERE
                  ${r}.source_from IS NOT NULL AND ${r}.key_from IS NOT NULL AND ${r}.source_to IS NOT NULL AND ${r}.key_to IS NOT NULL
                  ${whereAfter ? `AND ${whereAfter}` : ''}
                ${ik === kind ? `AND (${r}.key_from != ${r}.key_to) OR (${r}.source_from != ${r}.source_to)` : ''}    
              ORDER BY ${r}.serial ${isOrderDesc ? 'DESC' : 'ASC'}
              ${limit ? `LIMIT $<limit>` : ''}
              `;
          },
        );

        const query = [
          recordsQuery,
          [...outgoingSql, ...incomingSql]
            .filter(v => !!v)
            .map(v => `(${v})`)
            .join(' UNION '),
        ].join('\n');
        return db.manyOrNone(
          query,
          {
            afterSerial,
            kind,
            limit,
            offset,
          },
        );
      },
    ),
  );
};

/**
 * Insert relations
 * @param tableName
 * @param relations
 * @returns {string}
 */
const insertRelationsQuery = (tableName, relations) => {
  debug(`Planning to create ${relations.length} (or less) entity relations`);
  const cs = getRelationsColumns(tableName);
  const names = cs.names;
  const valuesSql = PGP.helpers.values(relations, cs);

  return `
          WITH v (${names}) AS (VALUES ${valuesSql})
          INSERT INTO ${tableName}
            (${names})
            (
              SELECT 
                v.source_from,
                v.key_from, 
                v.relation_kind,
                v.source_to,
                v.key_to,
                v.provider
              FROM v
              LEFT JOIN ${tableName} r ON
                  r.source_from = v.source_from 
                AND
                  r.key_from = v.key_from
                AND
                  r.relation_kind = v.relation_kind
                AND 
                  r.source_to = v.source_to
                AND 
                  r.key_to = v.key_to
              WHERE  
                (
                    r.source_from IS NULL
                  OR
                    r.key_from IS NULL
                  OR
                    r.relation_kind IS NULL 
                  OR
                    r.source_to IS NULL
                  OR
                    r.key_to IS NULL
                )
        )
        ON CONFLICT DO NOTHING
        RETURNING *
        `;
  // -- ON CONSTRAINT ${tableName}${PKEY_SUFFIX}
  // -- UPDATE SET
  // --  time_sys = TSRANGE(
  // --    lower(${tableName}.time_sys),
  // --    upper(EXCLUDED.time_sys)
  // --)
};

const sanitizeEntityFields = (rec, provider) => {
  ['kind', 'source', 'key'].forEach(k => {
      rec[k] = (isEmpty(rec[k]) ? null : `${rec[k]}`.toLocaleLowerCase()) || null;
    },
  );

  rec.media_type = rec.mediaType || rec.media_type;
  if (typeof rec.provider !== 'string') {
    if (typeof provider === 'string') {
      rec.provider = provider.toLocaleLowerCase();
    }
  }
  rec.time_source = tsToPostgre(
    rec.time_source
      ? new Date(
      Array.isArray(rec.time_source)
        ? rec.time_source[0]
        : rec.time_source,
      )
      : new Date(),
  );
  rec.time_sys = tsToPostgre(new Date());

  if ((!isEmpty(rec.record)) && isEmpty(rec.record_hash)) {
    rec.record_hash = hash(rec.record);
  }
  return rec;
};

const sanitizeRelationFields = (rec, provider) => {
  [
    'kind_from',
    'source_from',
    'key_from',
    'kind_to',
    'source_to',
    'key_to',
  ].forEach(k => {
      rec[k] = (isEmpty(rec[k]) ? null : `${rec[k]}`.toLocaleLowerCase()) || null;
    },
  );
  if ((!rec.provider) && (typeof provider === 'string')) {
    rec.provider = provider.toLocaleLowerCase();
  }
  if (!rec.relation_kind) {
    rec.relation_kind = DEFAULT_RELATION_KIND;
  } else {
    rec.relation_kind = `${rec.relation_kind.toLocaleLowerCase()}`;
  }
  // rec.time_valid = makeTsRange(rec.time_valid);
  rec.time_sys = tsToPostgre(new Date());
  rec.time_source = tsToPostgre(
    rec.time_source
      ? new Date(
      Array.isArray(rec.time_source)
        ? rec.time_source[0]
        : rec.time_source,
      )
      : new Date(),
  );
  rec.time_sys = new Date();
  return rec;
};

const RELATION_SUB_KEY_FIELDS = [
  'source_from',
  'key_from',
  'source_to',
  'key_to',
  'relation_kind',
];
const RELATION_MANDATORY_FIELDS = [
  'kind_from',
  'kind_to',
  ...RELATION_SUB_KEY_FIELDS,
];

const ANCHOR_MANDATORY_FIELDS = [
  'kind',
  'source',
  'key',
];
const ANCHOR_SUB_KEY_FIELDS = [
  'source',
  'key',
];


const DETAIL_MANDATORY_FIELDS = [
  'kind',
  'source',
  'key',
  'record_hash',
];

const DETAIL_SUB_KEY_FIELDS = [
  'source',
  'key',
  'record_hash',
];

const REL_FIELDS_TO_ANCHOR_FIELDS = [
  {
    kind: 'kind_from',
    source: 'source_from',
    key: 'key_from',
  },
  {
    kind: 'kind_to',
    source: 'source_to',
    key: 'key_to',
  },
];

const assertMandatoryFields = (rec, fields) => fields.reduce(
  (a, k) => a && (!isEmpty(rec[k])),
  true,
);

const insert = async (inputEntitiesAndRelations, provider, db) => {
  if (forceArray(inputEntitiesAndRelations).length === 0) {
    return [];
  }
  const readyRelations = {};
  const readyAnchors = {};
  const readyDetails = {};
  const sourcesDict = {};
  const providersDict = {};
  if (isEmpty(providersDict[provider])) {
    providersDict[provider] = provider;
  }
  inputEntitiesAndRelations.forEach(
    (rec) => {
      if (isEmpty(rec.provider)) {
        rec.provider = provider;
        // Already added above
      } else if (!providersDict[rec.provider]) {
        providersDict[rec.provider] = provider;
      }

      // Relation
      if (assertMandatoryFields(rec, RELATION_MANDATORY_FIELDS)) {
        rec = sanitizeRelationFields(rec, provider);
        [rec.source_from, rec.source_to].forEach(
          source => {
            if (!isEmpty(source)) {
              sourcesDict[source] = true;
            }
          },
        );

        // Relation
        const relationTableName = RELATION_NAME(rec.kind_from, rec.kind_to);
        const relationUk = RELATION_SUB_KEY_FIELDS.map(k => rec[k]).join('|');
        if (!isObject(readyRelations[relationTableName])) {
          readyRelations[relationTableName] = {};
        }
        if (!isObject(readyRelations[relationTableName][relationUk])) {
          readyRelations[relationTableName][relationUk] = rec;
        }

        REL_FIELDS_TO_ANCHOR_FIELDS.forEach((fmp) => {
          const anchorTableName = ANCHOR_NAME(rec[fmp.kind]);
          // Add possible missing anchors
          if (!isObject(readyAnchors[anchorTableName])) {
            readyAnchors[anchorTableName] = {};
          }

          const anchorUk = ANCHOR_SUB_KEY_FIELDS.map(k => rec[fmp[k]]).join('|');
          if (!isObject(readyAnchors[anchorTableName][anchorUk])) {
            readyAnchors[anchorTableName][anchorUk] = Object.keys(fmp).sort().reduce(
              (a, k) => ({
                ...a,
                [k]: rec[fmp[k]],
              }),
              {},
            );
          }

        });

      } else if (assertMandatoryFields(rec, ANCHOR_MANDATORY_FIELDS)) {
        rec = sanitizeEntityFields(rec, provider);
        if (rec !== null) {
          // Source dict
          if (!sourcesDict[rec.source]) {
            sourcesDict[rec.source] = true;
          }

          // Anchor
          const anchorTableName = ANCHOR_NAME(rec.kind);
          if (!isObject(readyAnchors[anchorTableName])) {
            readyAnchors[anchorTableName] = {};
          }
          const anchorUk = ANCHOR_SUB_KEY_FIELDS.map(k => rec[k]).join('|');
          if (!isObject(readyAnchors[anchorTableName][anchorUk])) {
            readyAnchors[anchorTableName][anchorUk] = rec;
          }

          // Detail
          if (assertMandatoryFields(rec, DETAIL_MANDATORY_FIELDS)) {
            const detailTableName = ENTITY_NAME(rec.kind);
            if (!isObject(readyDetails[detailTableName])) {
              readyDetails[detailTableName] = {};
            }

            const detailsUk = DETAIL_SUB_KEY_FIELDS.map(k => rec[k]).join('|');
            if (!isObject(readyDetails[detailTableName][detailsUk])) {
              readyDetails[detailTableName][detailsUk] = rec;
            }
          }
        }
      }
    },
  );

  const sources = Object.keys(sourcesDict).sort();
  const providers = Object.keys(providersDict).sort();
  const result = {
    anchors: {},
    details: {},
    relations: {},
    sources: 0,
    tables: [],
    providers: 0,
  };
  db = db || (await getDb());
  const tables = {
    anchors: Object.keys(readyAnchors).sort(),
    details: Object.keys(readyDetails).sort(),
    relations: Object.keys(readyRelations).sort(),
  };
  const missingTables = await whichTablesAreMissing(tables, db);
  const missingCount = sumNestedLen(missingTables);
  if (missingCount > 0) {
    warn(`[WORKER:${process.pid}] Missing tables will be created (${missingCount} new expected): ${flatten(Object.values(missingTables)).join(', ')}`);
    try {
      await ensureTables(tables, null);
    } catch (e) {
      warn(
        [
          `Error during upsert of new DB tables:`,
          `${e}`,
          `Usually this means innocent concurrency result when first table creation attempt was successful, and other attempts got state change in window between table creation pre-check (PostgreSQL specific detail) and execution or real atomic creation operation.`,
        ].join('\m'),
      );
    }
  }
  result.sources = (await updateSources(sources, db)).length;
  result.providers = (await updateProviders(providers, db)).length;
  if ((Object.keys(readyRelations).length + Object.keys(readyDetails).length + Object.keys(readyAnchors).length) > 0) {
    await cpMap(
      [
        ...(Object.keys(readyAnchors).length > 0 ? [{
          name: 'anchors',
          data: readyAnchors,
          queryFn: insertAnchorsQuery,
        }] : []),
        ...(Object.keys(readyRelations).length > 0 ? [{
          name: 'relations',
          data: readyRelations,
          queryFn: insertRelationsQuery,
        }] : []),
        ...(Object.keys(readyDetails).length > 0 ? [{
          name: 'details',
          data: readyDetails,
          queryFn: insertDetailsQuery,
        }] : []),
      ],
      async ({ data, queryFn, name }) => cpMap(
        Object.keys(data).sort(),
        async (tableName) => {
          const keys = Object.keys(data[tableName]).sort();
          const dataArr = flattenDeep(keys.map(key => data[tableName][key]));
          const query = queryFn(tableName, dataArr);
          const tableToKey = new RegExp(`^${[ANCHOR_TABLE_PREFIX, DETAIL_TABLE_PREFIX, RELATION_TABLE_PREFIX].join('|')}`, 'ui');
          result[name][tableName.replace(tableToKey, '')] = {
            total: keys.length,
            affected: (await db.result(query)).rowCount,
          };
        },
      ),
    );
    return result;
  } else {
    return [];
  }
};

const refreshDbStats = async (useCache = false) => {
  debug('Refreshing materialized views');
  const ents = await describeDbEntities(useCache);
  const db = await getDb();
  const q = Object.values(ents).reduce((a, v) => ([
      ...a,
      v.stat.table,
      ...Object.values(v.outgoing || {}).map(({ stat }) => stat.table), // Only outgoing 4 uniqueness
    ]),
    [],
  ).sort().map(
    (table) => `REFRESH MATERIALIZED VIEW CONCURRENTLY ${table};`,
  ).join('\n');
  if (q.trim()) {
    await db.none(q);
  }
};
module.exports = {
  query,
  insert,
  lookupRelations,
  queryEntities,
  queryAnchors,
  ensureTables,
  getAnchorColumns,
  getDetailColumns,
  countRelations,
  countAnchors,
  countAllAnchors,
  getAllRelations,
  refreshDbStats,
};
