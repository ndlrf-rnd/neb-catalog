#!/bin/bash

export CATALOG_BASE_URI=${CATALOG_BASE_URI:-'https://catalog.rusneb.ru/'}
export SEED_CATALOG_BASE_URI=${SEED_CATALOG_BASE_URI:-$CATALOG_BASE_URI}
export CATALOG_KEY_TOKEN=${CATALOG_KEY_TOKEN:-'13ac570f4cedb9b8ce7711a2c763b04e'}

# ! WARNING! DATABASE RESET COMMAND !
# $ killall -q node
# $ npm run reset:hard
# ! DONT EXECUTE ACCIDENTALLY !


# FIXME: Deploy worker as stand-alone service.
cd /home/node
forever --minUptime 1000 --spinSleepTime 5000 --sourceDir /home/node  /home/node/forever.json

"$@"
