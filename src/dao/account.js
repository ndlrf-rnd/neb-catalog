/**
 * Naive data provider API accounts generation
 * @returns {string}
 * @constructor
 */
const { verify, hash } = require('../crypto/argon2');
const crypto = require('crypto');
const { getDb } = require('./db-lifecycle');
const { uniq, cpMap, parseTsRange, error } = require('../utils');
const {
  T_PROVIDERS,
  T_PROVIDER_ACCOUNTS,
} = require('./constants');

const UUID_SIZE_BYTES = 16;

const genToken = (
  length = UUID_SIZE_BYTES,
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

const createProviderAccount = async (
  { provider, email, secret, power },
  autoCreateProvider = true,
) => {
  const db = await getDb();

  secret = (typeof secret === 'string')
    ? secret.toLowerCase().replace(/[^a-z0-9]/, '')
    : (await genTokenStr());
  const secret_hash = await hash(secret);
  const providerExists = await db.oneOrNone(
    `SELECT * FROM ${T_PROVIDERS} WHERE code = $<provider>;`,
    { provider },
  );
  const accountExists = await db.oneOrNone(
    `SELECT * FROM ${T_PROVIDER_ACCOUNTS} WHERE (email = $<email>) AND (provider = $<provider>) LIMIT 1;`,
    {
      provider,
      email,
    },
  );
  if (accountExists) {
    throw new Error(`Account of ${provider} with email ${email} already exits.`);
  }
  if (!providerExists) {
    if (autoCreateProvider) {
      await db.none(
        `INSERT INTO ${T_PROVIDERS} (code) VALUES ($<provider>);`,
        { provider },
      );

    } else {
      throw new Error(`No such provider registered: "${provider}" to bind news account "${email}"`);
    }
  }
  try {
    const q = `
      INSERT INTO ${T_PROVIDER_ACCOUNTS}
          (provider, email, secret_hash, power) 
        VALUES 
          ($<provider>, $<email>, $<secret_hash>, $<power>)
        RETURNING *`;
    const res = await db.one(
      q,
      {
        provider,
        email,
        secret_hash,
        power: !!power,
      },
    );
    return {
      time_sys: res.time_sys,
      provider,
      email,
      secret,
      power: res.power,
      isValid: (await authenticateBySecret({
        provider,
        email,
        secret,
      })).providers.length > 0,
    };
  } catch (e) {
    error(e);
    throw e;
  }
};


const authenticateBySecret = async ({ secret, email }) => {
  const db = await getDb();
  const accRecs = await db.manyOrNone(
    `SELECT provider, email, secret_hash, time_sys, power FROM ${T_PROVIDER_ACCOUNTS} WHERE (email = $<email>);`,
    { email },
  );
  const verificationResults = await cpMap(accRecs, async rec => verify(rec.secret_hash, secret));
  const verified = accRecs.filter((rec, idx) => verificationResults[idx]);
  return verified.reduce(
    (a, o) => ({
      time_sys: parseTsRange(o.time_sys),
      email: o.email,
      providers: uniq([...a.providers, o.provider]),
      power: o.power || a.power,
    }),
    {
      email: null,
      authenticated: verified.length,
      power: false,
      providers: [],
    },
  );
};

module.exports = {
  createProviderAccount,
  authenticateBySecret,
};
