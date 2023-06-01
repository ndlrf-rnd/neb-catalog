
  CREATE TYPE lro_type AS ENUM (
    'CANCELLED', 'CANCELLING', 'FAILED', 'FINALIZING', 'PENDING', 'PROCESSING', 'SUCCESSFUL', 'UNSPECIFIED'
  );

CREATE TABLE operations (
  id                  SERIAL                    PRIMARY KEY,
  requires            INTEGER[],
  type                VARCHAR                   NOT NULL DEFAULT 'shallow',
  account             VARCHAR                   NOT NULL,
  state               lro_type               NOT NULL DEFAULT 'PENDING', 

  parameters          JSONB                     NOT NULL,
  output              JSONB,

  documents_estimated BIGINT,
  documents_completed BIGINT                    NOT NULL DEFAULT 0,
  bytes_estimated     BIGINT,
  bytes_completed     BIGINT                    NOT NULL DEFAULT 0,

  worker_pid          INT,  -- Use: $ cat /proc/sys/kernel/pid_max
  retries             INT                       NOT NULL DEFAULT 0,
  created_at          TIMESTAMP WITH TIME ZONE  NOT NULL DEFAULT NOW(),
  running_time        TSTZRANGE                 NOT NULL DEFAULT TSTZRANGE(NULL, NULL)
);

CREATE INDEX IF NOT EXISTS
  operations__running_time__idx_btree
  ON operations
  USING btree (created_at NULLS LAST, lower(running_time) DESC NULLS LAST, upper(running_time) DESC NULLS LAST);

CREATE INDEX  IF NOT EXISTS 
  operations__requires__idx_btree 
  ON operations USING GIN(requires);  

CREATE INDEX IF NOT EXISTS operations__type__state__retries__idx
  ON operations 
  USING btree (type, state, retries);

CREATE OR REPLACE FUNCTION queue_operations_state_notify()
RETURNS trigger AS
$$
  BEGIN
    PERFORM pg_notify(
      'sid_queue',
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
    ON operations 
  FOR EACH ROW
EXECUTE PROCEDURE queue_operations_state_notify();


CREATE TABLE workers (
  id                  SERIAL                    PRIMARY KEY,
  pid                 INTEGER                   NOT NULL,
  address             VARCHAR(1024)
);
