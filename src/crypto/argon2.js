const argon2 = require('argon2');
const CYPHER_ARGON2_OPTIONS = {
  hashLength: 32,
  saltLength: 16,
  timeCost: 3,
  memoryCost: 1 << 12,
  parallelism: 1,
  type: argon2.argon2i,
};

const hash = async (input) =>
  await argon2.hash(
    input,
    CYPHER_ARGON2_OPTIONS,
  );

const verify = async (
  hashStr,
  secret,
  options = CYPHER_ARGON2_OPTIONS,
) => {
  return argon2.verify(
    hashStr,
    secret,
    options,
  );
}

module.exports = {
  hash,
  verify,
};