// noinspection JSUnusedLocalSymbols
const { getDb } = require('../../dao/db-lifecycle');
const {
  LRO_SQL_TYPE,
  LRO_OPERATIONS_TABLE_NAME,
  LRO_OPERATION_MAX_SILENCE_TIME_SEC,
  LRO_OPERATION_STATE,
} = require('./constants');

/*
 OR (
            (
              CURRENT_TIMESTAMP  - upper(${LRO_OPERATIONS_TABLE_NAME}.running_time)
            ) > '${LRO_OPERATION_MAX_SILENCE_TIME_SEC} seconds'::interval
          )
 */

const rearmHangedOperations = async () => (await getDb()).manyOrNone(
  `UPDATE ${LRO_OPERATIONS_TABLE_NAME}
  SET 
    ${LRO_OPERATIONS_TABLE_NAME}.state = $1::${LRO_SQL_TYPE},
    ${LRO_OPERATIONS_TABLE_NAME}.retries = ${LRO_OPERATIONS_TABLE_NAME}.retries + 1,
    ${LRO_OPERATIONS_TABLE_NAME}.running_time = TSTZRANGE(
      lower(${LRO_OPERATIONS_TABLE_NAME}.running_time),
      CURRENT_TIMESTAMP 
    )
  WHERE id = (
    SELECT ${LRO_OPERATIONS_TABLE_NAME}.id
    FOR UPDATE
    FROM ${LRO_OPERATIONS_TABLE_NAME}
    WHERE (
      ${LRO_OPERATIONS_TABLE_NAME}.state = $2::${LRO_SQL_TYPE}
    ) AND (
      (
        CURRENT_TIMESTAMP  - upper(${LRO_OPERATIONS_TABLE_NAME}.running_time)
      ) > '${LRO_OPERATION_MAX_SILENCE_TIME_SEC} seconds'::interval
    )
  ) RETURNING *;`,
  [LRO_OPERATION_STATE.PENDING, LRO_OPERATION_STATE.PROCESSING],
);
module.exports = {
  rearmHangedOperations,
};
