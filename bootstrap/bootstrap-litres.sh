#!/bin/bash
set -ex

export SEED_CATALOG_BASE_URI=${SEED_CATALOG_BASE_URI:-https://catalog.rusneb.ru/}
export SEED_CATALOG_PROVIDER_ACCOUNT=${SEED_CATALOG_PROVIDER_ACCOUNT:-catalog@rusneb.ru}

## LITRES
curl -s -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/litres.ru/litres-0_2003-01-01_2020-09-08.xml.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.litres.publication+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
curl -s -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/litres.ru/litres-1_2003-01-01_2020-09-08.xml.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.litres.publication+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
curl -s -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/litres.ru/litres-4_2003-01-01_2020-09-08.xml.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.litres.publication+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
curl -s -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/litres.ru/litres-11_2003-01-01_2020-09-08.xml.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.litres.publication+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
###Actually its worse than separate categories
#curl -s -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/litres.ru/litres-all_2003-01-01_2020-09-08.xml.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.litres.publication+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
