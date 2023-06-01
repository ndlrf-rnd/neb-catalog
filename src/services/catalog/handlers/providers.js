var qrcode = require('qrcode-terminal');
const { createProviderAccount } = require('../../../dao/account');
const { ___ } = require('../../../i18n/i18n');

const { sendResponse } = require('../formatResponse');
const { T_PROVIDERS } = require('../../../dao/constants');
const { getDb } = require('../../../dao/db-lifecycle');

const getProviders = async (req, res, next) => {
  const db = await getDb();
  const providers = await db.manyOrNone(`SELECT code, metadata FROM ${T_PROVIDERS} ORDER BY code;`);
  sendResponse(200, req, res, providers);
};

const postCreateProvider = async (req, res) => {
  if (req.ctx.power) {
    try {
      const createdAccount = await createProviderAccount(
        {
          provider: req.body.code,
          email: req.body.email,
          power: req.body.power || false,
        },
        true,
      );
      sendResponse(200, req, res, {
        'secretQr': qrcode.generate(createdAccount.secret),
        createdAccount,
      });
    }catch(e){
      sendResponse(500, req, res, e);
    }
  } else {
    sendResponse(403, req, res, new Error('Not authorized'));
  }
  next();
};

const patchProviders = async (req, res, next) => {
  if (req.ctx.power) {
    sendResponse(200, req, res, {});
  } else {
    sendResponse(403, req, res, new Error('Not authorized'));
  }
};

module.exports = {
  getProviders,
  postCreateProvider,
  patchProviders,
};
