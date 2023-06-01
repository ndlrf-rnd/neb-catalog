const crypto = require('crypto');
const { formatUuid } = require('../utils');
const { PROVIDER_TOKEN_SIZE_BYTES } = require('../constants');
const UUID_SIZE_BYTES = 16;

const genToken = (
  length = PROVIDER_TOKEN_SIZE_BYTES,
) => new Promise(
  (resolve, reject) => crypto.randomBytes(
    length,
    (err, buf) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf);
      }
    }),
);

const genTokenStr = async () => (
  await genToken(UUID_SIZE_BYTES)
).toString('hex').toLowerCase();

module.exports = {
  genToken,
  genTokenStr,
};