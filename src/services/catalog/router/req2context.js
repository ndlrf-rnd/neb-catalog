const {
  OPDS2_CONFIG,
  ORDER_DEFAULT,
  FLAG_TRUE,
  ORDER_ASC,
  ORDER_DESC,
} = require('../../../constants');
const { decryptCursor } = require('../../../crypto/cursor');
const { error, tsToPg } = require('../../../utils');

const req2context = (req) => {

  // Url
  let extension = OPDS2_CONFIG.defaultExtension.replace(/^[.]/ui, '');
  const baseUri = OPDS2_CONFIG.baseUri.replace(/[\/]+$/, '');
  const url = new URL(req.url, baseUri);

  url.pathname = url.pathname.replace(/[\/]$/ui, `.${extension}`);


  // Time
  const processingStartTsMs = (new Date()).getTime();

  // Pagination
  const extended = req.query.extended;
  const before = req.query.before;
  const noCache = req.query.noCache;
  const after = req.query.after;
  const all = `${req.query.all}`.trim().toLocaleUpperCase() === FLAG_TRUE.toLocaleUpperCase();
  const order = `${req.query.order || ORDER_DEFAULT}`.toLocaleLowerCase() === ORDER_ASC.toLocaleLowerCase()
    ? ORDER_ASC
    : ORDER_DESC;
  let beforeSerial = null;
  let afterSerial = null;
  if (req.query.before) {
    try {
      beforeSerial = decryptCursor(req.query.before);
    } catch (e) {
      error(`Decryption error`, e);
    }
  }

  if (req.query.after) {
    try {
      afterSerial = decryptCursor(req.query.after);
    } catch (e) {
      error(`Decryption error`, e);
    }
  }
  const until = req.query.until ? tsToPg(req.query.until) : null;
  const since = req.query.since ? tsToPg(req.query.since) : null;
  const limit = parseInt(req.query.limit, 10)
    ? Math.min(
      OPDS2_CONFIG.maxPageSize,
      Math.max(
        1,
        parseInt(`${req.query.limit}`, 10),
      ),
    )
    : OPDS2_CONFIG.defaultPageSize;

  if (limit !== OPDS2_CONFIG.defaultPageSize) {
    url.searchParams.set('limit', limit);
  } else {
    url.searchParams.delete('limit');
  }

  if (order && (order !== ORDER_DEFAULT)) {
    url.searchParams.set('order', order);
  } else {
    url.searchParams.delete('order');
  }


  let statCountThreshold = null;
  if (req.query.statCountThreshold) {
    statCountThreshold = (typeof req.query.statCountThreshold !== 'undefined')
      ? parseInt(req.query.statCountThreshold, 10)
      : OPDS2_CONFIG.statCountThreshold;
  }
  if (statCountThreshold) {
    url.searchParams.set('statCountThreshold', `${statCountThreshold}`);
  }

  const timeRangeInStat = req.query.timeRangeInStat || false;
  if (timeRangeInStat) {
    url.searchParams.set('timeRangeInStat', `true`);
  } else {
    url.searchParams.delete('timeRangeInStat');
  }
  if (extended) {
    url.searchParams.set('extended', `${extended}`);
  }
  if (all) {
    url.searchParams.set('all', `${all}`);
  }
  if (before) {
    url.searchParams.set('before', `${before}`);
  }
  if (after) {
    url.searchParams.set('after', `${after}`);
  }
  if (until) {
    url.searchParams.set('until', `${until}`);
  }
  if (since) {
    url.searchParams.set('since', `${since}`);
  }
  const forceProperties = true;
  const mediaType = OPDS2_CONFIG.defaultMediaType;

  const _export = req.query.export || '';
  return {
    baseUri,
    url,
    order,
    mediaType,
    timeRangeInStat,
    statCountThreshold,
    all,
    since,
    until,
    noCache,
    after,
    afterSerial,
    beforeSerial,
    extended,
    before,
    limit,
    forceProperties,
    export: _export,
    processingStartTsMs,
  };
};

module.exports = {
  req2context,
};
