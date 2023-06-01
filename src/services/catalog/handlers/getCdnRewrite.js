const mediaStorage = require('../../../mediaStorage');

const { MEDIA_STORAGE_CONF } = require('../../../constants');
const { sendResponse } = require('./../formatResponse');
const { joinUriParts, debug } = require('./../../../utils');

const getCdnRewrite = async (req, res, next) => {
  const rewrittenUrl = joinUriParts(
    (MEDIA_STORAGE_CONF.S3.useSSL ? 'https' : 'http') + '://' + (MEDIA_STORAGE_CONF.S3.endPoint),
    req.ctx.url.pathname.replace(MEDIA_STORAGE_CONF.cdnRewritePath, ''),
  );
  try {
    const signedUrl = await mediaStorage.signUrl(rewrittenUrl);
    debug(`[CDN:REWRITE] ${req.ctx.url.href} --> ${rewrittenUrl} --> ${signedUrl}`);
    res.redirect(302, signedUrl);
  } catch (e) {
    sendResponse(
      500, req, res,
      new Error(`[CDN:REWRITE] ${req.ctx.url.href} --> ${rewrittenUrl} --X ERROR: ${e.message}`),
    );
  }
  next();
};
module.exports = { getCdnRewrite };
