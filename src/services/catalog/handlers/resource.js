const { _title } = require('../../../i18n/i18n');

const {
  countRelations,
  queryAnchors,
  queryEntities,
} = require('../../../dao/dao');
const {
  sortLinks,
  dbToLinks,
  countResourceChildren,
  convertRecords,
  sanitizeLink,
  getRelations,
  isPublicationKind,
} = require('../common');
const { genNavigationGroup } = require('../groups/navigationGroup');
const {
  GROUPING_ENTITIES,
  LINK_ENTITIES,
  OPDS2_CONFIG,
} = require('../../../constants');

const { sendResponse } = require('../formatResponse');
const {
  defaults,
  uniqBy,
  sortBy,
  info,
  error,
  isEmpty,
  pickBy,
  flattenDeep,
  forceArray,
  get,
  pick,
} = require('../../../utils');


const getResource = async (req, res) => {
  info(
    `[OPDS2:getResource] ${req.ctx.kind}/${req.ctx.source}/${req.ctx.key}`);

  req.ctx.numberOfItems = await countResourceChildren(req.ctx.kind, req.ctx.source, req.ctx.key);
  const q = {
    nodes: [pick(req.ctx, ['kind', 'source', 'key'])],
    ...pick(req.ctx, ['limit', 'order', 'since', 'until']),
  };
  let masterEntities = forceArray(await queryEntities(q));

  if (masterEntities.length === 0) {
    // No master entity, look for anchors at least
    masterEntities = await queryAnchors(q);
    if (masterEntities.length === 0) {
      return sendResponse(
        404, req, res,
        new Error(`Entity not found: ${req.ctx.kind}/${req.ctx.source}/${req.ctx.key}`),
      );
    }
  }

  const convertedMasterEntities = flattenDeep(
    await convertRecords(
      masterEntities.slice(0, 1),
      {
        ...req.ctx,
        limit: req.ctx.limit,
        incoming: true,
        outgoing: false, // will be processed further
      },
    ),
  );

  if (typeof get(convertedMasterEntities[0] || {}, ['metadata']) !== 'object') {
    error(`No OPDS2 metadata found for resource: ${req.ctx.kind}/${req.ctx.source}/${req.ctx.key}`);
  }

  // const rq = {
  //   since: req.ctx.since,
  //   until: req.ctx.until,
  //   order: req.ctx.order,
  //   limit: req.ctx.limit,
  //   b: req.ctx.before,
  //   before: req.ctx.beforeSerial,
  //   after: req.ctx.afterSerial,
  //   a: req.ctx.after,
  //   incoming: false, // isPublicationKind(masterEntities[0].kind),
  //   outgoing: false,//!isPublicationKind(masterEntities[0].kind),
  // };
  const masterRelations = flattenDeep(
    await getRelations(
      masterEntities.slice(0, 1),
      {
        since: req.ctx.since,
        until: req.ctx.until,
        order: req.ctx.order,
        limit: req.ctx.limit,
        before: req.ctx.beforeSerial,
        after: req.ctx.afterSerial,
        incoming: true, // isPublicationKind(masterEntities[0].kind),
        outgoing: true,//!isPublicationKind(masterEntities[0].kind),
      },
    ),
  );
  const sanitizedMasterRelations = uniqBy(
    forceArray(masterRelations).map(
      ({ kind_to, key_to, source_to, direction }) => ({
        kind: kind_to,
        source: source_to,
        key: key_to,
        direction,
      }),
    ),
    rec => [rec.kind, rec.source, rec.key].join('|'),
  );

  const dbEntitiesArr = await queryEntities({
    nodes: sanitizedMasterRelations,
    since: req.ctx.since,
    until: req.ctx.until,
    limit: req.ctx.limit,
    incoming: false,
    outgoing: false,
  });
  let dbEntitiesDict = (dbEntitiesArr).reduce(
    (a, e) => ({
      ...a,
      [[e.kind, e.source, e.key].join('|')]: e,
    }),
    {},
  );
  const dbEntities = masterRelations.map(
    ({ kind_to, source_to, key_to, direction, serial }) => ({
      source: source_to,
      key: key_to,
      kind: kind_to,
      direction,
      ...(dbEntitiesDict[[kind_to, source_to, key_to].join('|')] || {}),
      serial,
    }),
  );
  const publications = isPublicationKind(masterEntities[0].kind) ? [] : await convertRecords(
    dbEntities.filter(({ kind }) => isPublicationKind(kind)),
    {
      outgoing: true,
      incoming: true,
      ...req.ctx,
    },
  );

  /* Links */
  const linksEntities = masterRelations.filter(
    ({ direction, kind_to }) => (direction === 'from') && (LINK_ENTITIES.indexOf(kind_to) !== -1),
  ).map(({ direction, key_to, source_to, kind_to }) => ({
    key: key_to,
    source: source_to,
    kind: kind_to,
    direction,
  }));
  const identifier = `${req.ctx.url.href || req.ctx.url}`.split('?')[0];
  const dbLinks = await dbToLinks(linksEntities, req.ctx);
  const linksObj = [
    ...forceArray(masterEntities[0].links),
    {
      ..._title('Download source record'),
      rel: 'convertedFrom',
      type: masterEntities[0].mediaType,
      href: `${identifier}`.replace(/([\/])?$/uig, '?export=raw'),
    },
    ...dbLinks,
  ].filter(
    ({ rel }) => (rel !== 'self'),
  ).reduce((a, o) => ({
    ...a,
    [o.href]: defaults(a[o.href] || {}, o),
  }), {});

  const renderedRelations = sortBy(Object.values(linksObj), v => v.href);
  const selfProperties = pickBy(
    {
      modified: masterEntities[0].time_source || masterEntities[0].time_sys,
    },
    v => !isEmpty(v),
  );
  const links = sortLinks(
    [
      {
        rel: 'self',
        ...(Object.keys(selfProperties).length > 0 ? { properties: selfProperties } : {}),
        type: OPDS2_CONFIG.defaultMediaType,
        href: identifier,
      },
      ...renderedRelations,
    ],
    req.ctx.baseUri,
  );
  if (!isPublicationKind(masterEntities[0].kind)) {

    req.ctx.numberOfPageItems = dbEntities.length;
    req.ctx.numberOfItems = (await countRelations(
      masterEntities.map(m => pick(m, ['kind', 'source', 'key'])),
      {
        incoming: false,
        outgoing: true,
      },
    ))[0];
  }
  const navigation = [
    ...(await genNavigationGroup(masterRelations.filter(({ direction }) => direction === 'from'), req.ctx)),
    // ...((GROUPING_ENTITIES.indexOf(masterEntities[0].kind) !== -1) ? renderedRelations : []),
    ...(isPublicationKind(masterEntities[0].kind) ? [] : renderedRelations),
  ].map(l => sanitizeLink(l, req.ctx.baseUri));


  sendResponse(
    200,
    req,
    res,
    {
      ...convertedMasterEntities[0],
      metadata: {
        ...(convertedMasterEntities[0].metadata || {}),
        ...(
          isPublicationKind(masterEntities[0].kind)
            ? {}
            : {
              itemsPerPage: req.ctx.limit,
              numberOfItems: req.ctx.numberOfItems,
              numberOfPageItems: publications ? publications.length : 0,
            }),
      },
      ...(links ? { links } : {}),
      ...(publications.length > 0 ? { publications } : {}),
      navigation,
    },
  );
};


module.exports = {
  getResource,
  countResourceChildren,
};
