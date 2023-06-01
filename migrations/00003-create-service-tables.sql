
-- Data sourcesm

CREATE TABLE IF NOT EXISTS sources (
    code        VARCHAR   NOT NULL,
    time_sys    TSRANGE   NOT NULL DEFAULT TSRANGE(NOW()::timestamp, NULL),
    metadata    JSONB,
    CONSTRAINT sources_pkey PRIMARY KEY (code)
);

  CREATE INDEX IF NOT EXISTS
    sources__time_sys__idx_btree
    ON sources
    USING btree (
      time_sys DESC NULLS LAST 
      
    )
;




-- Data providersm

CREATE TABLE IF NOT EXISTS providers (
    code        VARCHAR   NOT NULL,
    time_sys    TSRANGE   NOT NULL DEFAULT TSRANGE(NOW()::timestamp, NULL),
    metadata    JSONB,
    CONSTRAINT providers_pkey PRIMARY KEY (code)
);

  CREATE INDEX IF NOT EXISTS
    providers__time_sys__idx_btree
    ON providers
    USING btree (
      time_sys DESC NULLS LAST 
      
    )
;




-- Data providers accountsm

CREATE TABLE IF NOT EXISTS provider_accounts (
    provider        VARCHAR   NOT NULL REFERENCES providers (code),
    email           VARCHAR   NOT NULL,
    secret_hash     VARCHAR   NOT NULL,
    power           BOOLEAN   NOT NULL DEFAULT FALSE,
    time_sys        TSRANGE   NOT NULL DEFAULT TSRANGE(NOW()::timestamp, NULL),
    CONSTRAINT provider_accounts_pkey PRIMARY KEY (provider, email, secret_hash)
);

  CREATE INDEX IF NOT EXISTS
    provider_accounts__time_sys__idx_btree
    ON provider_accounts
    USING btree (
      time_sys DESC NULLS LAST 
      
    )
;

