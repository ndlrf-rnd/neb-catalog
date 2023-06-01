const LRO_OPERATIONS_TABLE_NAME = 'operations';
const LRO_WORKERS_TABLE_NAME = 'workers';
const LRO_SQL_TYPE = 'lro_type';
const LRO_OPERATION_DEFAULT_TYPE = 'shallow';
const LRO_QUEUE_CHANNEL = 'sid_queue';
const CANCELLING = 'CANCELLING';
const CANCELLED = 'CANCELLED';
const FAILED = 'FAILED';
const FINALIZING = 'FINALIZING';
const PENDING = 'PENDING';
const PROCESSING = 'PROCESSING';
const SUCCESSFUL = 'SUCCESSFUL';
const UNSPECIFIED = 'UNSPECIFIED';
const LRO_PRESERVE_ERROR_STACK = true;
const LRO_OPERATION_STATE = {
  [PENDING]: PENDING,
  [PROCESSING]: PROCESSING,
  [CANCELLING]: CANCELLING,
  [CANCELLED]: CANCELLED,
  [FINALIZING]: FINALIZING,
  [SUCCESSFUL]: SUCCESSFUL,
  [FAILED]: FAILED,
  [UNSPECIFIED]: UNSPECIFIED,
};

/**
 * Long-Running Operations engine
 * @type {function(...[*]=)}
 */
const BOOTSTRAP_LRO = `
  CREATE TYPE ${LRO_SQL_TYPE} AS ENUM (
    ${Object.values(LRO_OPERATION_STATE).sort().map(v => `'${v}'`).join(', ')}
  );

CREATE TABLE ${LRO_OPERATIONS_TABLE_NAME} (
  id                  SERIAL                    PRIMARY KEY,
  requires            INTEGER[],
  type                VARCHAR                   NOT NULL DEFAULT '${LRO_OPERATION_DEFAULT_TYPE}',
  account             VARCHAR                   NOT NULL,
  state               ${LRO_SQL_TYPE}               NOT NULL DEFAULT '${LRO_OPERATION_STATE.PENDING}', 

  parameters          JSONB                     NOT NULL,
  output              JSONB,

  documents_estimated BIGINT,
  documents_completed BIGINT                    NOT NULL DEFAULT 0,
  bytes_estimated     BIGINT,
  bytes_completed     BIGINT                    NOT NULL DEFAULT 0,

  worker_pid          INT,  -- Use: $ cat /proc/sys/kernel/pid_max
  retries             INT                       NOT NULL DEFAULT 0,
  created_at          TIMESTAMP WITH TIME ZONE  NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  running_time        TSTZRANGE                 NOT NULL DEFAULT TSTZRANGE(NULL, NULL)
);

CREATE INDEX IF NOT EXISTS
  ${LRO_OPERATIONS_TABLE_NAME}__running_time__idx_btree
  ON ${LRO_OPERATIONS_TABLE_NAME}
  USING btree (created_at NULLS LAST, lower(running_time) DESC NULLS LAST, upper(running_time) DESC NULLS LAST);

CREATE INDEX  IF NOT EXISTS 
  ${LRO_OPERATIONS_TABLE_NAME}__requires__idx_btree 
  ON ${LRO_OPERATIONS_TABLE_NAME} USING GIN(requires);  

CREATE INDEX IF NOT EXISTS ${LRO_OPERATIONS_TABLE_NAME}__type__state__retries__idx
  ON ${LRO_OPERATIONS_TABLE_NAME} 
  USING btree (type, state, retries);

CREATE OR REPLACE FUNCTION queue_operations_state_notify()
RETURNS trigger AS
$$
  BEGIN
    PERFORM pg_notify(
      '${LRO_QUEUE_CHANNEL}',
      NEW.id::TEXT
      -- CONCAT('{"id": "', NEW.id::TEXT, ', "',  NEW.state::TEXT, ', "', NEW.progress::TEXT, '"}')
    );
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER queue_operations_state
  AFTER 
    INSERT 
    OR UPDATE OF 
      documents_estimated,
      documents_completed,
      bytes_estimated,
      bytes_completed,
      state
    ON ${LRO_OPERATIONS_TABLE_NAME} 
  FOR EACH ROW
EXECUTE PROCEDURE queue_operations_state_notify();


CREATE TABLE ${LRO_WORKERS_TABLE_NAME} (
  id                  SERIAL                    PRIMARY KEY,
  pid                 INTEGER                   NOT NULL,
  address             VARCHAR(1024)
);
`;

const LRO_DROP = `
CREATE TABLE IF NOT EXISTS ${LRO_OPERATIONS_TABLE_NAME} ();
DROP TABLE IF EXISTS ${LRO_OPERATIONS_TABLE_NAME} CASCADE;
DROP TYPE IF EXISTS ${LRO_SQL_TYPE} CASCADE;
`;
const DESC = 'DESC';
const ASC = 'ASC';
const LRO_ORDER = {
  [DESC]: DESC,
  [ASC]: ASC,
};
const DEFAULT_LIST_OPERATIONS_LIMIT = 300;

const LRO_DEFAULT_LIST_OPERATIONS_ORDER = LRO_ORDER.DESC;

const LRO_OPERATION_MAX_SILENCE_TIME_SEC = 60 * 60;
const BACKGROUND_IDLE_CHECKER_INTERVAL_MS = 60 * 1000

module.exports = {
  LRO_ORDER,
  BACKGROUND_IDLE_CHECKER_INTERVAL_MS,
  DEFAULT_LIST_OPERATIONS_LIMIT,
  LRO_DEFAULT_LIST_OPERATIONS_ORDER,
  LRO_OPERATIONS_TABLE_NAME,
  BOOTSTRAP_LRO,
  LRO_DROP,
  LRO_PRESERVE_ERROR_STACK,
  LRO_QUEUE_CHANNEL,
  LRO_OPERATION_DEFAULT_TYPE,
  LRO_OPERATION_STATE,
  LRO_SQL_TYPE,
  LRO_OPERATION_MAX_SILENCE_TIME_SEC,
};
