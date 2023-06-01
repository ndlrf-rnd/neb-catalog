const { isObject } = require('../../../utils');
const { OPDS2_CONFIG } = require('../../../constants');
const { describeDbEntities } = require('../../../dao/db-lifecycle');
const {
  queryEntities,
  countAnchors,
} = require('../../../dao/dao');
const { genNavigationGroup } = require('./navigationGroup');
const { _title } = require('../../../i18n/i18n');
const {
  pick,
  forceArray,
  info,
  capitalize,
} = require('../../../utils');
const {
  dbToLinks,
  isPublicationKind,
  convertRecords,
  sortLinks,
  sanitizeLink,
  getRecordUrl,
} = require('../common');

const resourceOfSameKindGroup = async (ctx) => {
  info(`[OPDS2:getResourcesOfSameKind] ${ctx.url}`);
  const entitiesSchema = await describeDbEntities();

  const dbEntities = (typeof entitiesSchema[ctx.kind] === 'undefined')
    ? []
    : await queryEntities({
        nodes: forceArray(pick(ctx, ['kind', 'source', 'key'])),
        ...pick(ctx, ['limit', 'after', 'since', 'until', 'order']),
        incoming: true,
        outgoing: true,
      },
    );

  ctx.numberOfItems = await countAnchors(ctx.kind, ctx.source);

  const titleFields = _title('All {{kind}} records', { kind: capitalize(ctx.kind) });
  const title = titleFields.title;

  // Merge processed and cached records
  const publicationsRaw = dbEntities.filter(({ kind }) => isPublicationKind(kind));
  const publications = await convertRecords(
    publicationsRaw,
    {
      ...ctx,
      incoming: true,
      outgoing: true,
    },
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
  const linksFromDb = dbEntities.filter(({ kind }) => !isPublicationKind(kind));
  // Navigation
  const navigation = [
    ...(await genNavigationGroup(dbEntities, ctx)),
    ...(await dbToLinks(linksFromDb, {
      ...ctx,
      outgoing: true,
      forceProperties:false
    })),
  ];

  const identifier = getRecordUrl(pick(ctx, ['kind', 'source', 'key', 'extended']), ctx.baseUri);
  return {
    metadata: {
      ...titleFields,
      '@type': 'https://schema.org/Collection',
      'type': OPDS2_CONFIG.defaultMediaType,
      '@id': identifier,
      'identifier': identifier,
      numberOfItems: ctx.numberOfItems, // Not mandatory
      numberOfPageItems: ctx.numberOfPageItems,
    },
    ...((links.length > 0) ? { links } : {}),
    ...((publications.length > 0) ? { publications } : {}),
    navigation,
  };
};

module.exports = { resourceOfSameKindGroup };
