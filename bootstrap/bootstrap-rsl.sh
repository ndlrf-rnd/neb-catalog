#!/bin/bash
set -ex

export SEED_CATALOG_BASE_URI=${SEED_CATALOG_BASE_URI:-https://catalog.rusneb.ru/}
export SEED_CATALOG_PROVIDER_ACCOUNT=${SEED_CATALOG_PROVIDER_ACCOUNT:-catalog@rusneb.ru}
function run_import () {
  export URL="${1}"
  export PROVIDER="${2:-'rusneb.ru'}"
  SECRET='13ac570f4cedb9b8ce7711a2c763b04e'
  CATALOG_ACCOUNT='catalog@rusneb.ru'
  export mediaType=${3:-'application/marc'}
  curl -d "{\"secret\":\"${SECRET}\", \"account\":\"${CATALOG_ACCOUNT}\", \"type\": \"import\", \"parameters\": {\"url\": \"${URL}\", \"provider\": \"${PROVIDER}\", \"mediaType\": \"${mediaType}\"}}"  -H "Content-Type: application/json"  -X POST ${SEED_CATALOG_BASE_URI}operations.json
}
mkdir -p ./logs
export SOURCE_PATH=${SOURCE_PATH:-"https://storage.rusneb.ru/source"}

# RuMoRGB

run_import "${SOURCE_PATH}/aleph.rsl.ru/20201128_035005_rsl01_cl.mrc.gz" aleph.rsl.ru application/marc
run_import "${SOURCE_PATH}/aleph.rsl.ru/20201128_035012_rsl02_cl.mrc.gz" aleph.rsl.ru application/marc
run_import "${SOURCE_PATH}/aleph.rsl.ru/20201128_035720_rsl07_cl.mrc.gz" aleph.rsl.ru application/marc
run_import "${SOURCE_PATH}/aleph.rsl.ru/20201128_035731_rsl10_cl.mrc.gz" aleph.rsl.ru application/marc
run_import "${SOURCE_PATH}/aleph.rsl.ru/20201128_035750_rsl11_cl.mrc.gz" aleph.rsl.ru application/marc
run_import "${SOURCE_PATH}/aleph.rsl.ru/20201128_041425_rsl60_cl.mrc.gz" aleph.rsl.ru application/marc
