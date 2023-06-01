const { authenticateBySecret } = require('../../../dao/account');
const { forceArray } = require('../../../utils');

const auth = async (req) => {
  const account = req.body.account || req.query.account ? decodeURIComponent(`${req.body.account || req.query.account}`).trim().toLocaleLowerCase() : null;
  const secret = req.body.secret || req.query.secret ? decodeURIComponent(`${req.body.secret || req.query.secret}`).trim().toLocaleLowerCase() : null;

  if (!account) {
    return {
      power: false,
      account: null,
      authorizedFor: [],
    };
  }

  const r = await authenticateBySecret(
    {
      email: account,
      secret: secret,
    },
  );
  const { providers, power } = r;
  if (providers.length > 0) {
    return {
      power,
      account,
      authorizedFor: forceArray(providers),
    };
  } else {
    throw new Error('[AUTH] You are not authorized due invalid or not existing secret token provided');
  }

};
module.exports = {
  auth,
};
