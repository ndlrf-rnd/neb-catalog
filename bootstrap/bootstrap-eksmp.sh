#!/bin/bash
set -ex

export SEED_CATALOG_BASE_URI=${SEED_CATALOG_BASE_URI:-https://catalog.rusneb.ru/}
export SEED_CATALOG_PROVIDER_ACCOUNT=${SEED_CATALOG_PROVIDER_ACCOUNT:-catalog@rusneb.ru}

## LITRES
curl -s -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/eksmo.ru/eksmo.ru-2020-09-08-full.xml.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.editeur.org+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
