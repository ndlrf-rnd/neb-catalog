#!/bin/bash
set -ex

export SEED_CATALOG_BASE_URI=${SEED_CATALOG_BASE_URI:-https://catalog.rusneb.ru/}
export SEED_CATALOG_PROVIDER_ACCOUNT=${SEED_CATALOG_PROVIDER_ACCOUNT:-catalog@rusneb.ru}
export SOURCE_PATH=${SOURCE_PATH:-"https://storage.rusneb.ru/source"}

# LOD and classification
#curl -s -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/lod.rsl.ru/bbkskosudc_2020-04-30_10-08-05.nq.gz", "provider": "rusneb.ru", "mediaType": "application/n-quads"}}'   -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json

# BBK
curl -s -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/lod.rsl.ru/bbk_2020-04-30_10-06-46.nq.gz", "provider": "rusneb.ru", "mediaType": "application/n-quads"}}'   -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json

# UDC
curl -s -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/lod.rsl.ru/UDC_2020-04-29_15-57-33.nq.gz", "provider": "rusneb.ru", "mediaType": "application/n-quads"}}'   -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json

# BISACH
curl -s -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/bisacsh/bisacsh.tsv.gz", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
