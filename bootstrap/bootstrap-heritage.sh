#!/bin/bash
set -ex

export SEED_CATALOG_BASE_URI=${SEED_CATALOG_BASE_URI:-https://catalog.rusneb.ru/}
export SEED_CATALOG_PROVIDER_ACCOUNT=${SEED_CATALOG_PROVIDER_ACCOUNT:-catalog@rusneb.ru}

# HERITAGE
#heritage__item__to__urlpdf_2020_test1.tsv
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__item__to__urlpdf_2020_test1.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json

# Collections bodies
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__collection__details.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__collection__to__collection.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json

# KNPam Registry
# 2020-10-22
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/knpam.rusneb.ru-rkp-db-2020-10-22.json.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.rusneb.knpam+json"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
# 2020-11-01
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/knpam.rusneb.ru-rkp-db-2020-11-01.json.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.rusneb.knpam+json"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/knpam.rusneb.ru-rkp-db-2020-11-10.json.gz", "provider": "rusneb.ru", "mediaType": "application/vnd.rusneb.knpam+json"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json

# Collections to items
curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__collection__to__item_2020.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json

# Marcs
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__RuMoRGB_2019-12-13_marc21.mrc", "provider": "rusneb.ru", "mediaType": "application/marc"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__RuSpRNB_2019_11_14_rusmarc.mrc", "provider": "rusneb.ru", "mediaType": "application/marc"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json

# Archival
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__archival__RuMoRGB.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}' -H "Content-Type: application/json" -X POST ${SEED_CATALOG_BASE_URI}operations.json
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__archival__to__instance__RuMoRGB.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json

# TSV
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__collection__to__item.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__url__details-2019-12-13.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__item__to__url.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__item__to__instance.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/knpam.rusneb.ru/heritage__items__details_RuMoRGB.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json

# dc.mkrf.ru
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "url":"https://storage.rusneb.ru/source/dc.mkrf.ru/dc.mkrf.ru__heritage__collection__to__item.tsv", "provider": "rusneb.ru", "mediaType": "text/tab-separated-values"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
#curl -d '{"account": "catalog@rusneb.ru", "secret":"13ac570f4cedb9b8ce7711a2c763b04e", "type": "import", "parameters": { "source": "dc.mkrf.ru", "url":"https://storage.rusneb.ru/source/dc.mkrf.ru/dc.mkrf.ru-2020-07-17.xml", "provider": "rusneb.ru", "mediaType": "application/atom+xml"}}'  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
