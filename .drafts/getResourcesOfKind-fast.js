const { ORDER_DESC } = require('../../../constants');
const { describeDbEntities } = require('../../../dao/db-lifecycle');
const {
  queryEntities,
  countAnchors,
} = require('../../../dao/dao');
const { genNavigationGroup } = require('../navigationGroup');
const { sendResponse } = require('../formatResponse');
const { _title } = require('../../../i18n/i18n');
const {
  sortBy,
  pick,
  forceArray,
  info,
  capitalize,
} = require('../../../utils');
const {
  isPublicationKind,
  convertRecords,
  sortLinks,
  sanitizeLink,
  getRecordUrl,
} = require('../feed-common');

const {
  OPDS2_CONFIG,
} = require('../../../constants');

const resourceOfSameKindGroup = async (ctx) => {
  info(`[OPDS2:getResourcesOfKind] ${[ctx.kind, ctx.source].join('/')}`);

  const titleFields = _title('All {{kind}} records', { kind: capitalize(ctx.kind) });
  const title = titleFields.title;


  const entitiesSchema = (await describeDbEntities());

  const MICRO_BATCH_SIZE = 1000;
  const limit = Math.min(ctx.limit, MICRO_BATCH_SIZE);
  let retrieved = 0;
  let after = undefined;
  let serials = [];
  ctx.numberOfItems = await countAnchors(ctx.kind, ctx.source);
  while (true) {
    const q = {
      nodes: forceArray(pick(ctx, ['kind', 'source', 'key'])),
      ...pick(ctx, ['since', 'until', 'order']),
      after,
      limit,
    };
    const dbEntities = (typeof entitiesSchema[ctx.kind] === 'undefined')
      ? []
      : await queryEntities(q,
      );
    ctx.numberOfPageItems += dbEntities.length;

    // Merge processed and cached records
    const publicationsRaw = dbEntities.filter(({ kind }) => isPublicationKind(kind));
    const publications = sortBy(
      await convertRecords(
        publicationsRaw,
        {
          incoming: false,
          outgoing: true,
        },
        ctx,
      ),
    );
    const links = sortLinks(
      [
        {
          rel: 'self',
          title,
          type: OPDS2_CONFIG.defaultMediaType,
          href: `${ctx.url.href}`.split('?')[0],
        },
      ],
      ctx.baseUri,
    );

    // const linksFromDb = dbEntities.filter(({ kind }) => !isPublicationKind(kind));


    // Navigation
    serials = serials.concat(dbEntities.map(e => pick(e, ['serial', 'record_hash', 'media_type'])));

    const maxSerial = dbEntities.reduce((maxAcc, { serial }) => Math.max(serial, maxAcc), 1);
    const minSerial = dbEntities.reduce((minAcc, { serial }) => Math.min(serial, minAcc), Infinity);
    after = ctx.order === ORDER_DESC ? minSerial : maxSerial;

    console.error('retr', retrieved, links.length, publications.length, maxSerial, minSerial, after);
    if ((ctx.numberOfPageItems >= ctx.limit) || (after && (after <= 1))) {
      break;
    }
  }
  const navigation = [
    ...(await genNavigationGroup(serials, ctx)),
  ].map(
    l => sanitizeLink(l, ctx.baseUri),
  );
  const identifier = getRecordUrl(pick(ctx, ['kind', 'source', 'key']), ctx.baseUri);

  return {
    metadata: {
      ...titleFields,
      '@type': 'http://schema.org/Collection',
      'type': OPDS2_CONFIG.defaultMediaType,
      '@id': identifier,
      'identifier': identifier,
      cacheKeys: serials.map(({ record_hash, media_type }) => [ctx.kind, record_hash, media_type, OPDS2_CONFIG.defaultMediaType].join(':')),
      numberOfItems: ctx.numberOfItems, // Not mandatory
      numberOfPageItems: ctx.numberOfPageItems,
    },
    // ...((links.length > 0) ? { links } : {}),
    // ...((publications.length > 0) ? { publications } : {}),
    navigation,
  };
};

const getResourcesOfKind = async (req, res) => {
  try {
    return sendResponse(200, req, res, await resourceOfSameKindGroup(req.ctx));
  } catch (e) {
    return sendResponse(404, req, res, {
      error: (process.env.NODE_ENV === 'test')
        ? `${e.message}\n${e.stack}`
        : e.message || `${e}`,
    });
  }
};

module.exports = {
  resourceOfSameKindGroup,
  getResourcesOfKind,
};
