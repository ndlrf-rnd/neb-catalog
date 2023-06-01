#!/bin/bash
set -x
export SEED_CATALOG_BASE_URI=${SEED_CATALOG_BASE_URI:-'http://catalog-master.dev.neb.rsl/'}
export SEED_CATALOG_PROVIDER_ACCOUNT=${SEED_CATALOG_PROVIDER_ACCOUNT:-'catalog@rusneb.ru'}
export CATALOG_PROVIDER_SECRET=${CATALOG_PROVIDER_SECRET:-'13ac570f4cedb9b8ce7711a2c763b04e'}
export SVOD_CODE=${SVOD_CODE:-'bd-kp.rsl.ru'}
export SVOD_EMAIL=${SVOD_EMAIL:-'knizhpam@rsl.ru'}

mkdir -p "./logs/"

if [[ ! -f "./logs/${SVOD_CODE}.secret.txt" ]] ; then
  curl -s -d "{\"account\": \"${SEED_CATALOG_PROVIDER_ACCOUNT}\", \"secret\": \"${CATALOG_PROVIDER_SECRET}\", \"code\": \"${SVOD_CODE}\", \"email\": \"${SVOD_EMAIL}\", \"power\": false}" \
    -H "Content-Type: application/json" \
    -X POST "${SEED_CATALOG_BASE_URI}providers.json" \
    > "./logs/${SVOD_CODE}.response.txt"

  echo "Svod response:"
  cat "./logs/${SVOD_CODE}.response.txt"
  cat "./logs/${SVOD_CODE}.response.txt" | grep  -oP '(?<="secret":")[^ "]*' > "./logs/${SVOD_CODE}.secret.txt"
fi

export SVOD_SECRET=`cat "./logs/${SVOD_CODE}.secret.txt"`

echo "${SVOD_CODE} credentials: ${SVOD_EMAIL}:${SVOD_SECRET}"

curl -s -d "{\"type\": \"import\", \"parameters\": { \"url\":\"https://storage.rusneb.ru/source/bd-kp.rsl.ru/result-20.xml.gz\",  \"provider\": \"${SVOD_CODE}\", \"mediaType\": \"application/marcxml+xml\"}, \"account\": \"${SVOD_EMAIL}\", \"secret\":\"${SVOD_SECRET}\"}" -H "Content-Type: application/json" -X POST "${SEED_CATALOG_BASE_URI}operations.json"
curl -s -d "{\"type\": \"import\", \"parameters\": { \"url\":\"https://storage.rusneb.ru/source/bd-kp.rsl.ru/result-11.xml.gz\",  \"provider\": \"${SVOD_CODE}\", \"mediaType\": \"application/marcxml+xml\"}, \"account\": \"${SVOD_EMAIL}\", \"secret\":\"${SVOD_SECRET}\"}" -H "Content-Type: application/json" -X POST "${SEED_CATALOG_BASE_URI}operations.json"
curl -s -d "{\"type\": \"import\", \"parameters\": { \"url\":\"https://storage.rusneb.ru/source/bd-kp.rsl.ru/result-15.xml.gz\",  \"provider\": \"${SVOD_CODE}\", \"mediaType\": \"application/marcxml+xml\"}, \"account\": \"${SVOD_EMAIL}\", \"secret\":\"${SVOD_SECRET}\"}" -H "Content-Type: application/json" -X POST "${SEED_CATALOG_BASE_URI}operations.json"
curl -s -d "{\"type\": \"import\", \"parameters\": { \"url\":\"https://storage.rusneb.ru/source/bd-kp.rsl.ru/result-18.xml.gz\",  \"provider\": \"${SVOD_CODE}\", \"mediaType\": \"application/marcxml+xml\"}, \"account\": \"${SVOD_EMAIL}\", \"secret\":\"${SVOD_SECRET}\"}" -H "Content-Type: application/json" -X POST "${SEED_CATALOG_BASE_URI}operations.json"
curl -s -d "{\"type\": \"import\", \"parameters\": { \"url\":\"https://storage.rusneb.ru/source/bd-kp.rsl.ru/result-190.xml.gz\", \"provider\": \"${SVOD_CODE}\", \"mediaType\": \"application/marcxml+xml\"}, \"account\": \"${SVOD_EMAIL}\", \"secret\":\"${SVOD_SECRET}\"}" -H "Content-Type: application/json" -X POST "${SEED_CATALOG_BASE_URI}operations.json"
curl -s -d "{\"type\": \"import\", \"parameters\": { \"url\":\"https://storage.rusneb.ru/source/bd-kp.rsl.ru/result-21.xml.gz\",  \"provider\": \"${SVOD_CODE}\", \"mediaType\": \"application/marcxml+xml\"}, \"account\": \"${SVOD_EMAIL}\", \"secret\":\"${SVOD_SECRET}\"}" -H "Content-Type: application/json" -X POST "${SEED_CATALOG_BASE_URI}operations.json"
