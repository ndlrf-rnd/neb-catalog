const fs = require('fs');
const path = require('path');
const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const { req2context } = require('./req2context');
const { auth } = require('./auth');
const { sendResponse } = require('../formatResponse');
const { warn } = require('../../../utils');
const { getSchemas } = require('../handlers/schemas');
const { getResourceExport } = require('../handlers/getResourceExport');
const { getRawResource } = require('../handlers/getRawResource');
const { getResource } = require('../handlers/resource');
const { getResourceKindsList } = require('../handlers/resourceKinds');
const { handlerHome } = require('../handlers/home');
const { getStats } = require('../handlers/stats');
const { getCdnRewrite } = require('../handlers/getCdnRewrite');
const { getResourcesOfSameKind } = require('../handlers/getResourcesOfSameKind');
const { deleteResources } = require('../handlers/deleteResources');
const {
  postScheduleOperation,
  getOperations,
  deleteCancelOperation,
} = require('../handlers/operations');
const { postCreateProvider, getProviders } = require('../handlers/providers');
const { getSearch } = require('../handlers/search');
const { OPDS2_CONFIG, MEDIA_STORAGE_CONF } = require('../../../constants');


const Router = async (req, res, next) => {
  req.ctx = req2context(req, res);

  // Redirect with 303 code to url using default extension instead a trailing slash.
  if (req.ctx.url.pathname.match(/\/resources.*\.json[a-z0-9\-]*$/uig)) {
    const redirectUri = `${req.ctx.url.origin}${req.ctx.url.pathname}`.replace(/\.json[a-z0-9\-]*$/uig, '');
    return res.redirect(303, redirectUri);
  }

  let authResult;
  try {
    authResult = await auth(req);
  } catch (e) {
    return sendResponse(403, req, res, e);
  }
  Object.assign(req.ctx, authResult || {});
  const extRe = new RegExp(`[.]${req.ctx.extension}$`, 'ui');

  const pathChunks = req.ctx.url.pathname
    .split('.')
    .join('.')
    .split('/')
    .filter((x) => x.length > 0)
    .map(decodeURIComponent);
  pathChunks[pathChunks.length - 1] = pathChunks[pathChunks.length - 1].replace(extRe, '');
  if (pathChunks[0] && pathChunks[0].startsWith('resources')) {
    req.ctx.kind = pathChunks.length >= 2 ? decodeURIComponent(pathChunks[1]) : null;
    req.ctx.source = pathChunks.length >= 3 ? decodeURIComponent(pathChunks[2]) : null;
    req.ctx.key = pathChunks.length >= 4 ? pathChunks.slice(3).join('/') : null;
    if (req.ctx.kind && req.ctx.source && req.ctx.key) {
      if (req.ctx.export === 'raw') {
        return getRawResource(req, res);
      } else if (req.ctx.export) {
        return getResourceExport(req, res);
      } else {
        return getResource(req, res);
      }
    } else if (req.ctx.kind && req.ctx.source) {
      return getResourcesOfSameKind(req, res);
    } else if (req.ctx.kind) {
      return getResourcesOfSameKind(req, res);
    } else {
      return getResourceKindsList(req, res);
    }
  }
  return next();
};

const router = express.Router();
const bodyParserName = bodyParser[OPDS2_CONFIG.bodyParser] ? OPDS2_CONFIG.bodyParser : 'json';
router.use(bodyParser[bodyParserName](OPDS2_CONFIG.bodyParserConfig));
router.use(Router);

const faviconPath = path.join(OPDS2_CONFIG.staticPath, 'favicon.ico');
if (faviconPath) {
  if (fs.existsSync(faviconPath)) {
    router.use(favicon(faviconPath));
  } else {
    warn(`WARNING: No favicon file was found at path ${faviconPath}`);
  }
} else {
  warn(`WARNING: No favicon path is defined in config`);
}

if (OPDS2_CONFIG.staticPath) {
  if (fs.existsSync(OPDS2_CONFIG.staticPath)) {
    router.use('/static', express.static(OPDS2_CONFIG.staticPath));
    router.get('/', express.static(OPDS2_CONFIG.staticPath));
  } else {
    warn(`WARNING: No favicon file was found at path ${OPDS2_CONFIG.staticPath}`);
  }
} else {
  warn(`WARNING: No favicon path is defined in config`);
}


router.get('/operations(.:extension)?', getOperations);
router.post('/operations(.:extension)?', postScheduleOperation);

router.delete('/operations/(:id)(.:extension)?', deleteCancelOperation);
router.delete('/operations/(:id)/?', deleteCancelOperation);
router.get('/operations/(:id)(.:extension)?', getOperations);

router.get('/stats.(:extension)?', getStats);

router.get('/resources(.:extension)?', getResourcesOfSameKind);
router.get('/resources/*', getResourcesOfSameKind);

router.get('/index(.:extension)?', handlerHome);

router.delete('/resources/*', deleteResources);

router.get('/schemas/*', getSchemas);
router.get('/schemas(.:extension)?', getSchemas);

router.get('/providers/*', getProviders);
router.get('/providers(.:extension)?', getProviders);

router.post('/providers/*', postCreateProvider);
router.post('/providers(.:extension)?', postCreateProvider);

router.get(MEDIA_STORAGE_CONF.cdnRewritePath + '*', getCdnRewrite);
router.get('/search/?', getSearch);
router.get('/search.(:extension)?', getSearch);

module.exports = {
  router,
};


// TODO: add Link: <https://schema.example.com/entry> rel=describedBy
