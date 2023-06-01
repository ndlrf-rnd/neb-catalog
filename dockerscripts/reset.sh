#!/bin/bash

export SEED_CATALOG_BASE_URI=${SEED_CATALOG_BASE_URI:-'https://catalog.rusneb.ru/'}
export CATALOG_KEY_TOKEN=${CATALOG_KEY_TOKEN:-'13ac570f4cedb9b8ce7711a2c763b04e'}
killall -q node
node ./src/index.js reset --i-know-what-i-am-doing --key-token ${CATALOG_KEY_TOKEN}
