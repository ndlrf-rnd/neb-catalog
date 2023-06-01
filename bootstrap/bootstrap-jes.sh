#!/bin/bash
set -ex

export SEED_CATALOG_BASE_URI=${SEED_CATALOG_BASE_URI:-https://catalog.rusneb.ru/}
export SEED_CATALOG_PROVIDER_ACCOUNT=${SEED_CATALOG_PROVIDER_ACCOUNT:-catalog@rusneb.ru}

# RAS.JES.SU
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/ras.jes.su/artsoc-2019-2.xml.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.jes.journal+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/ras.jes.su/history-2019-4-77.xml.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.jes.journal+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/ras.jes.su/ran-emm-3-issue.2019.55.3_unicode.xml.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.jes.journal+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/ras.jes.su/ran-rh-4-issue.2019.4_unicode.xml.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.jes.journal+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
