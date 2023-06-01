const { ___ } = require('../../../i18n/i18n');
const { ORDER_DESC } = require('../../../constants');
const {
  replaceUriParam,
  info,
  forceArray,
  sortBy,
} = require('../../../utils');
const { encryptCursor } = require('../../../crypto/cursor');
const { sanitizeLink } = require('../common');

const genNavigationGroup = async (dbEntities, ctx) => {
  const oe = sortBy(forceArray(dbEntities), ['kind', 'serial', 'id']);
  ctx.numberOfPageItems = oe.length;
  if (ctx.numberOfPageItems > 0) {
    const minRec = oe[0];
    const minSerial = minRec.kind_from && minRec.kind_from
      ? [minRec.kind_from, minRec.kind_to, minRec.serial || minRec.id]
      : [minRec.kind, minRec.serial || minRec.id];

    const maxRec = oe[oe.length - 1];
    const maxSerial = maxRec.kind_from && maxRec.kind_to
      ? [maxRec.kind_from, maxRec.kind_to, maxRec.serial || maxRec.id]
      : [maxRec.kind, maxRec.serial || maxRec.id];

    ctx.beforeSerial = ctx.order === ORDER_DESC ? maxSerial : minSerial;
    ctx.afterSerial = ctx.order === ORDER_DESC ? minSerial : maxSerial;
  }
  const {
    beforeSerial,
    afterSerial,
    url,
    numberOfPageItems,
    kind,
    source,
    key,
    order,
  } = ctx;


  info(`[OPDS2:CURSOR] [${encryptCursor(afterSerial)} >= CURRENT PAGE IDS >= Before ${encryptCursor(beforeSerial)}]`);

  const href = new URL(`${url}`, ctx.baseUri);
  href.pathname = [
    ['resources', kind, source, key]
      .filter((v) => !!v)
      .map(encodeURIComponent)
      .join('/'),
  ].join('.');

  const links = [];
  const descOk = (order === ORDER_DESC) && (numberOfPageItems > 0) && (ctx.afterSerial[ctx.afterSerial.length - 1] > 1) && (ctx.afterSerial);
  if (descOk) {
    links.push({
      rel: 'next',
      title: ___('Next page'),
      href: decodeURIComponent(replaceUriParam(ctx.url, 'after', encryptCursor(ctx.afterSerial)).href),
    });
  }

  if (ctx.after) {
    links.push({
      rel: 'first',
      title: ___('First page'),
      href: decodeURIComponent(replaceUriParam(replaceUriParam(ctx.url, 'after', null), 'before', null).href),
    });
  }
  if (ctx.afterSerial) {
    ctx.after = encryptCursor(ctx.afterSerial);
  }
  if (ctx.beforeSerial) {
    ctx.before = encryptCursor(ctx.beforeSerial);
  }

  return links.map(link => sanitizeLink(link, ctx.baseUri));
};


module.exports = {
  genNavigationGroup,
};
