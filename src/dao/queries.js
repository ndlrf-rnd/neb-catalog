const { ENTITY_LOCK_CODE,RELATION_LOCK_CODE } = require('../constants');
const { sanitizeEntityKind } = require('../utils/text');
const {
  RELATION_STATISTICS_TABLE_PREFIX,
  DETAIL_STATISTICS_TABLE_PREFIX,
  FKEY_SUFFIX,
  PKEY_SUFFIX,
  T_SOURCES,
  T_PROVIDERS,
  ANCHOR_TABLE_PREFIX,
  DETAIL_TABLE_PREFIX,
  RELATION_TABLE_PREFIX,
  RELATION_TABLE_SEPARATOR,
} = require('./constants');
const {
  TIME_SOURCE_IDX,
  TIME_SYS_IDX,
} = require('./indexes');

const ANCHOR_NAME = (entity) => ANCHOR_TABLE_PREFIX + sanitizeEntityKind(entity, true);
const ENTITY_NAME = (entity) => DETAIL_TABLE_PREFIX + sanitizeEntityKind(entity, true);
const RELATION_STATISTICS_NAME = (entity) => RELATION_STATISTICS_TABLE_PREFIX + sanitizeEntityKind(entity, true);
const DETAIL_STATISTICS_NAME = (entity) => DETAIL_STATISTICS_TABLE_PREFIX + sanitizeEntityKind(entity, true);

const RELATION_NAME = (entityKindFrom, entityKindTo) => (
  RELATION_TABLE_PREFIX
  + sanitizeEntityKind(entityKindFrom, false)
  + RELATION_TABLE_SEPARATOR
  + sanitizeEntityKind(entityKindTo, false)
);

const BREAK_RELATION_NAME = (tableName) => {

  const [kind_from, kind_to] = tableName.split(RELATION_TABLE_PREFIX)[1].split(RELATION_TABLE_SEPARATOR);
  return {
    kind_from,
    kind_to,
  };
};


/**
 * Core structure
 * @returns {string}
 * @constructor
 * @param tableName
 */
const RELATION = (tableName) => {
  const anchorFrom = ANCHOR_NAME(BREAK_RELATION_NAME(tableName).kind_from);
  const anchorTo = ANCHOR_NAME(BREAK_RELATION_NAME(tableName).kind_to);
  const statisticsTableName = tableName.replace(RELATION_TABLE_PREFIX, RELATION_STATISTICS_TABLE_PREFIX);
  return `SELECT pg_advisory_xact_lock(${RELATION_LOCK_CODE});
  CREATE TABLE IF NOT EXISTS ${tableName} (
    serial        SERIAL    UNIQUE,
    source_from   VARCHAR   NOT NULL,  -- Source will be constrained on anchor level 
    key_from      VARCHAR   NOT NULL,
    relation_kind VARCHAR   NOT NULL,
    source_to     VARCHAR   NOT NULL,  -- Source will be constrained on anchor level
    key_to        VARCHAR   NOT NULL,
    provider      VARCHAR   NOT NULL,
    time_sys      timestamp NOT NULL  DEFAULT NOW()::timestamp,
    time_source   timestamp NOT NULL  DEFAULT NOW()::timestamp,
    
    FOREIGN KEY (source_from, key_from) REFERENCES ${anchorFrom} (source, key),
    FOREIGN KEY (source_to, key_to) REFERENCES ${anchorTo} (source, key),
    CONSTRAINT ${tableName}${PKEY_SUFFIX} PRIMARY KEY (
      source_from, 
      key_from,
      relation_kind,
      source_to,
      key_to
    )
  );
  ${TIME_SOURCE_IDX(tableName, [])}
  ${TIME_SYS_IDX(tableName, [])}
  
  CREATE MATERIALIZED VIEW IF NOT EXISTS ${statisticsTableName}
  AS SELECT DISTINCT ON (
    source_from,
    source_to,
    relation_kind,
    provider,
    since
  ) 
    source_from                         AS source_from,
    source_to                           AS source_to,
    relation_kind                       AS relation_kind,
    provider                            AS provider,
    date_trunc('day', time_sys)         AS since,
    COUNT(*)                            AS count
  FROM ${tableName}
  GROUP BY source_from, source_to, relation_kind, provider, since;

  CREATE UNIQUE INDEX IF NOT EXISTS ${statisticsTableName}${PKEY_SUFFIX} ON ${statisticsTableName} (source_from, source_to, relation_kind, provider, since);
  ;
  `;
};


const DETAIL = (entityName) => {

  const statisticsTableName = DETAIL_STATISTICS_TABLE_PREFIX + (entityName.replace(DETAIL_TABLE_PREFIX,''))
  const anchorTableName = ANCHOR_TABLE_PREFIX + (entityName.replace(DETAIL_TABLE_PREFIX,''));
  const detailTableName = DETAIL_TABLE_PREFIX + (entityName.replace(DETAIL_TABLE_PREFIX,''));
  return `SELECT pg_advisory_xact_lock(${ENTITY_LOCK_CODE});

  CREATE TABLE IF NOT EXISTS ${anchorTableName} (
    serial        SERIAL    UNIQUE,
    
    source  VARCHAR   NOT NULL
                        CONSTRAINT ${anchorTableName}__${T_SOURCES}_code${FKEY_SUFFIX}
                        REFERENCES ${T_SOURCES} (code),
    key     VARCHAR   NOT NULL,

    -- Anchors don't have provider field by design
    CONSTRAINT ${anchorTableName}${PKEY_SUFFIX} PRIMARY KEY (source, key)
  );

  CREATE TABLE IF NOT EXISTS ${detailTableName} (
    serial        SERIAL    UNIQUE,
    source        VARCHAR   NOT NULL,
    key           VARCHAR   NOT NULL,
    provider      VARCHAR   NOT NULL,

    time_source   timestamp NOT NULL  DEFAULT NOW()::timestamp,
    time_sys      timestamp NOT NULL  DEFAULT NOW()::timestamp,

    record        TEXT,
    record_hash   UUID,       
    media_type    VARCHAR,

    -- time_valid    TSRANGE   NOT NULL  DEFAULT TSRANGE(NULL, NULL),
    -- record        TEXT      NOT NULL  DEFAULT '',
    -- record_hash   UUID      NOT NULL,       
    
    CONSTRAINT ${detailTableName}${PKEY_SUFFIX} PRIMARY KEY (
      source,
      key,
      record_hash,
      provider
    ), 
    CONSTRAINT ${detailTableName}__${T_SOURCES}${FKEY_SUFFIX} 
      FOREIGN KEY (source, key) 
      REFERENCES ${anchorTableName} (source, key),
    
    CONSTRAINT ${detailTableName}__${T_PROVIDERS}__code${FKEY_SUFFIX}
      FOREIGN KEY (provider)
      REFERENCES ${T_PROVIDERS} (code)
  );
  ${TIME_SOURCE_IDX(detailTableName, ['source NULLS LAST', 'key NULLS LAST', 'provider NULLS LAST'])}
  ${TIME_SYS_IDX(detailTableName, ['source NULLS LAST', 'key NULLS LAST', 'provider NULLS LAST'])}
  
  CREATE MATERIALIZED VIEW IF NOT EXISTS ${statisticsTableName}
  AS
  SELECT DISTINCT ON (source, provider, since) 
    source                              AS source,
    provider                            AS provider,
    date_trunc('day', time_sys)         AS since,
    COUNT(*)                            AS count
  FROM ${detailTableName}
  GROUP BY source, provider, since;
  
  CREATE UNIQUE INDEX IF NOT EXISTS ${statisticsTableName}${PKEY_SUFFIX} ON ${statisticsTableName} (
    source,
    provider,
    since
  );
`;
};


module.exports = {
  RELATION_STATISTICS_NAME,
  DETAIL_STATISTICS_NAME,
  ANCHOR_NAME,
  ANCHOR_TABLE_PREFIX,
  ENTITY: DETAIL,
  ENTITY_NAME,
  FKEY_SUFFIX,
  DETAIL_TABLE_PREFIX,
  PKEY_SUFFIX,
  RELATION,
  RELATION_NAME,
  RELATION_TABLE_PREFIX,
  RELATION_TABLE_SEPARATOR,
};
