#!/bin/bash
set -ex

export SEED_CATALOG_BASE_URI=${SEED_CATALOG_BASE_URI:-https://catalog.rusneb.ru/}
export SEED_CATALOG_PROVIDER_ACCOUNT=${SEED_CATALOG_PROVIDER_ACCOUNT:-catalog@rusneb.ru}

# RAS.JES.SU
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/retropress.rusneb.ru/10023-4559.opds2.json", "provider": "retropress.rusneb.ru", "mediaType": "application/opds+json"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
