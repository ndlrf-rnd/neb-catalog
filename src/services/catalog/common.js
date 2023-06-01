const mime = require('mime');
const formats = require('../../formats');
const { _title } = require('../../i18n/i18n');
const { describeTables, describeDbEntities, getDb } = require('../../dao/db-lifecycle');
const {
  mapValues,
  trimSlashes,
  normalizeUrlScheme,
  isUrl,
  sortBy,
  joinUriParts,
  defaults,
  pickBy,
  encodeUrlComponentRfc3986,
  omit,
  uniqBy,
  capitalize,
  pluralize,
  flattenDeep,
  forceArray,
  error,
  get,
  warn,
  pick,
  cpMap,
} = require('../../utils');
const {
  OPDS2_CONFIG,
  MEDIA_STORAGE_CONF,
  GROUPING_ENTITIES,
  LINK_ENTITIES,
} = require('../../constants');
const {
  countRelations,
  lookupRelations,
  countAnchors,
} = require('../../dao/dao');
const { executeParallel } = require('../../workers');

const sanitizeLink = (link, baseUri, noProperties = false) => {
  let href;
  let url;
  let normalizedUrl = normalizeUrlScheme(link.url || link.href || '').replace(baseUri, '');
  const endpointToken = `${MEDIA_STORAGE_CONF.S3.endPoint || ''}`.replace(/^[^:]+:\/\//ug, '');
  let alternate = [];
  if (endpointToken && (normalizedUrl.indexOf(endpointToken) !== -1)) {
    try {
      url = new URL(joinUriParts(baseUri, normalizedUrl));
      alternate.push(
        {
          title: 'Retrieve using SEED remote S3 resolver',
          rel: 'alternate',
          href: joinUriParts(
            baseUri,
            (MEDIA_STORAGE_CONF.cdnRewritePath),
            endpointToken,
            ...url.pathname.split(endpointToken).slice(1),
          ),
        },
      );
    } catch (e) {
      error(e);
      warn(`WARNING: Invalid CDN media URL: "${normalizedUrl}" ${e.error}`);
      return link;
    }
  }
  if (normalizedUrl.match(/\/resources\/(link|url|uri|urn|href)\//ui)) {
    normalizedUrl = normalizeUrlScheme(normalizedUrl.startsWith('/') ? normalizedUrl.replace(/^.*\/resources\/[^\/]*\//ui, '') : normalizedUrl);
  }
  normalizedUrl = normalizeUrlScheme(normalizedUrl.startsWith('/') ? joinUriParts(baseUri, normalizedUrl) : normalizedUrl);

  try {
    url = new URL(normalizedUrl, baseUri);
  } catch (e) {
    warn(`WARNING: Invalid link URL: "${normalizedUrl}" ${e.error}`);
    return link;
  }

  [
    'account',
    'after',
    'extended',
    'limit',
    'order',
    'secret',
    'since',
    'until',
  ].sort().forEach(kp => {
    if (link[kp] || (new URL(normalizedUrl, baseUri)).searchParams.get(kp)) {
      url.searchParams.set(kp, link[kp] || (new URL(normalizedUrl, baseUri)).searchParams.get(kp));
    }
  });


  const type = ((
    link.mediaType || link.type
      ? link.mediaType || link.type
      : mime.getType(url.href.split('?')[0]) || OPDS2_CONFIG.defaultMediaType
  ) || OPDS2_CONFIG.mediaType).replace('application/json', OPDS2_CONFIG.defaultMediaType);
  const rel = (link.rel ? link.rel.split(/[\p{Z}]+/uig).map(v => v.replace(/[a-z\-_]*item/uig, 'item')).join(' ') : link.rel) || 'item';
  href = href || url.href;
  return {
    ...(noProperties ? link : pick(link, ['title', 'name', 'properties', 'children'])),
    type,
    href,
    rel,
    ...(alternate.length ? { alternate } : {}),
  };
};


const isPublicationKind = (kind) => (LINK_ENTITIES.indexOf(kind) === -1) && (GROUPING_ENTITIES.indexOf(kind) === -1);

const makeRel = (rel, kind) => uniqBy([
  rel || 'item',
  kind === 'collection' ? 'collection' : null,
]).filter(v => !!v).sort().join(' ');

const sortLinks = (links, baseUri) => sortBy(
  forceArray(links).map(
    l => sanitizeLink(l, baseUri),
  ),
  ({ rel, title, href }) => [
    rel ? (rel === 'self') ? 'a' : (
      rel.match(/\/acquisition\/open-access/uig) ? 'b' : (
        rel.match(/\/acquisition/uig) ? 'c' : (
          rel.match(/convertedFrom/uig) ? 'z' : (
            rel.match(/first/uig) ? 'e' : 'f'
          )
        )
      )
    ) : '',
    href,
    title,
  ].join(''),
);

const getRecordUrl = (record, baseUri) => {
  if (record.href) {
    return record.href;
  }
  try {
    return `${new URL(record.key)}`;
  } catch (e) {
    return `${new URL(
      joinUriParts([
        baseUri,
        'resources',
        record.kind,
        record.source ? encodeUrlComponentRfc3986(record.source) : undefined,
        record.key,
      ]),
    )}`;
  }
};

const getRelations = async (entitiesOrEntity, qCtx) => {
  const relations = (qCtx.incoming || qCtx.outgoing)
    ? await lookupRelations({
      nodes: uniqBy(
        forceArray(entitiesOrEntity).filter(
          ({ kind, source, key }) => kind && source && key,
        ).map(
          ent => pick(ent, ['kind', 'source', 'key', 'provider']),
        ),
        ({ kind, source, key, provider }) => [kind, source, key, provider].join('\t'),
      ),
      ...qCtx,
    })
    : [];

  const groupedRelations = relations.reduce(
    (a, o) => {
      let k;
      k = (o.direction === 'to') && qCtx.incoming
        ? ['kind_from', 'source_to', 'key_to'].map(k => o[k]).join('|')
        : (
          (o.direction === 'from') && qCtx.outgoing
            ? ['kind_from', 'source_from', 'key_from'].map(k => o[k]).join('|')
            : null
        );
      if (!k) {
        return a;
      }
      return {
        ...a,
        [k]: [
          ...(a[k] || []),
          o.direction === 'to' ? {
            ...o,
            rel: o.relation_kind,
            kind: o.kind_to,
            source: o.source_from,
            key: o.key_from,
          } : {
            ...o,
            rel: o.relation_kind,
            kind: o.kind_from,
            source: o.source_to,
            key: o.key_to,
          },
        ],
      };
    },
    {},
  );
  const result = forceArray(entitiesOrEntity).map(
    (record) => get(
      groupedRelations,
      [record.kind, record.source, record.key].join('|'),
      [],
    ) || [],
  );
  return Array.isArray(entitiesOrEntity) ? result : result[0];
};

const convertRecords = async (inputEntities, ctx, flattenMetadata = false) => {
  const input = sortBy(
    forceArray(inputEntities).filter(e => !!e),
    ({ serial }) => -serial,
  );

  if (input.length === 0) {
    return [];
  }
  const convertedRaw = (input.filter(v => !v.relation_kind).length > 0)
    ? flattenDeep(await executeParallel('convertChunk', input, ctx))
    : input.map((record) => ({
      ...record,
      record: { metadata: {} },
    }));

  const allRelations = await getRelations(convertedRaw, pick(ctx, ['incoming', 'outgoing']));
  const linksRelations = allRelations.map(rls => rls.filter(({ direction }) => direction === 'from'));
  const parentRelations = allRelations.map(rls => rls.filter(({ direction }) => direction === 'to'));
  const counts = await countRelations(
    convertedRaw,
    {
      incoming: false,
      outgoing: ctx.outgoing,
    },
  );
  return flattenDeep(
    await cpMap(
      convertedRaw,
      async (
        recRaw,
        idx,
      ) => {
        const {
          record,
          serial,
          provider,
          kind,
          source,
          time_source,
          time_sys,
          key,
          media_type,
          type,
          // relation_kind
        } = recRaw;
        const identifier = getRecordUrl({
          kind,
          source,
          key,
        }, ctx.baseUri);

        const graphLinks = flattenDeep(forceArray(linksRelations[idx])).map(
          ({ kind, source, time_source, key, rel, title, metadata, time_sys }) => {
            const href = joinUriParts(
              (LINK_ENTITIES.indexOf(kind) !== -1)
                ? [
                  source.match(/^([^:\/.#?&]+\/\/:)?/ug)
                    ? decodeURI(source)
                    : (source.match(/^\/\/:/ug) ? normalizeUrlScheme(source) : source.replace(/^[\/]*/ug, OPDS2_CONFIG.baseUri)),
                  decodeURIComponent(key),
                ]
                : [
                  ctx.baseUri,
                  'resources',
                  ...[
                    kind,
                    source,
                    decodeURIComponent(key),
                  ],
                ],
            );
            const type = mime.getType(href) || OPDS2_CONFIG.defaultMediaType;
            return {
              rel,
              href,
              type,
              ...(title ? { title } : (metadata ? { title: metadata.title } : {})),
              properties: {
                ...(metadata ? { metadata } : {}),
                modified: time_source || time_sys,
              },
            };
          },
        );

        const inputMetadata = (typeof record === 'object') ? record.metadata || record : {};
        const recPaRel = flattenDeep(forceArray(parentRelations[idx]));

        const dbCollectionLinks = (recPaRel.length > 0) ? await dbToLinks(recPaRel, {
          ...ctx,
          incoming: false,
          outgoing: false,
        }) : [];
        // await cpMap(
        // forceArray(parentRelations[idx]),
        // async relation => await dbToLinks(forceArray(parentRelations[idx]), {
        //   ...ctx,
        //   incoming: false,
        //   outgoing: false,
        // }),
        // );

        const parentCollectionLinks = flattenDeep([
          ...(inputMetadata.belongsTo ? forceArray(inputMetadata.belongsTo.collection) : []),
          ...dbCollectionLinks,
        ]);

        const collection = sortBy(
          Object.values(
            parentCollectionLinks.reduce(
              (a, l) => {
                const link = l['@id'] || l.url || l.href || '';
                const k = link.startsWith('/') ? joinUriParts([ctx.baseUri, link]) : link;
                if (!k) {
                  return a;
                }
                const name = l.name || l.title || (l['@id'].split(/\/resources\/collection\//uig).slice(-1)[0].replace(/\//ug, ' '));
                const dict = {
                  ...l,
                  ...mapValues(
                    pick(l, ['identifier', '@id', 'url', 'uri', 'href', 'rel']),
                    v => (`${v}`.startsWith('/') ? joinUriParts(ctx.baseUri, v) : v),
                  ),
                  name,
                  href: k,
                };
                return ({
                  ...a,
                  [k]: defaults(a[k] || {}, dict),
                });
              },
              {},
            ),
          ),
          'href',
        );
        let metadata = {
          ...inputMetadata,
          identifier,
          '@id': identifier,
          type,
          numberOfItems: counts[idx],
          modified: time_sys,
          provider,
          ...(
            (parentCollectionLinks.length > 0)
              ? {
                belongsTo: {
                  collection,
                },
              }
              : {}
          ),
          ...(inputMetadata.toc ? { toc: inputMetadata.toc.map(part => sanitizeLink(part, ctx.baseUri)) } : {}),
          ...(ctx.extended ? {
            serial: `${kind}-${serial}`,
            relationSerial: allRelations[idx].serial,
            sourceModified: time_source,
          } : {}),
        };

        try {
          /**
           * https://tools.ietf.org/html/rfc7991
           */
          const links = sortLinks([
            ...graphLinks,
            ...(record ? forceArray(record.links) : []),
            ...(formats[media_type] && formats[media_type].to
              ? Object.keys(formats[media_type].to).filter(t => t !== OPDS2_CONFIG.defaultMediaType).sort().map((type) => ({
                title: `Export record to ${type}`,
                rel: 'export',
                type,
                href: `${identifier}`.replace(/([\/]*|\?.+|)$/uig, `?export=${type}`),
              }))
              : []),
            {
              ..._title('Download source record'),
              rel: 'convertedFrom',
              type: media_type,
              href: `${identifier}`.replace(/([\/]*|\?.+|)$/uig, '?export=raw'),
            },
          ], ctx.baseUri);

          const images = record ? forceArray(record.images).map(
            (im, idx) => ({
              ...im,
              rel: [im.rel, idx ? 'image' : 'cover'].filter(v => !!v).join(' '),
              type: im.type || mime.getType(im.href || im.url) || 'image/jpeg',
            }),
          ) : [];
          metadata = pickBy(metadata, v => forceArray(v).length > 0);
          return {
            ...(flattenMetadata ? metadata : { metadata }),
            ...(images.length > 0 ? { images } : {}),
            ...(links.length > 0 ? { links } : {}),
          };
        } catch (e) {
          error('ERROR:', input, 'record', record, 'ERROR', e);
        }
      },
    ),
  );
};

const dbToLinks = async (dbEntities, ctx) => {
  const input = flattenDeep(forceArray(dbEntities));
  const convertedRecords = await convertRecords(
    input,
    ctx,
  );
  return convertedRecords.map(
    (rec, idx) => {
      const properties = defaults(
        omit(rec.metadata, ['@id', 'identifier', 'href', 'url', 'name', 'title', 'type', 'children']),
        rec ? rec.properties : {},
        rec && rec.metadata ? rec.metadata.properties : {},
      );
      const title = rec.title || (typeof rec.name === 'object' ? rec.name[ctx.language] || rec.name.en : rec.name) || (rec.metadata ? rec.metadata.title || rec.metadata.name : undefined);
      return ({
        ...omit(rec, ['links', 'metadata', 'images', 'publications', 'title', 'type']),
        ...pick(rec.metadata || {}, ['type', 'href', 'url', '@id', 'children']),
        ...mapValues(
          val => `${val}`.split('?')[0] + ctx.url.search,
        ),
        ...(
          rec.metadata && (rec.metadata.href || rec.metadata['@id'] || isUrl(rec.metadata.identifier))
            ? { href: rec.metadata.href || rec.metadata['@id'] || rec.metadata.identifier }
            : {}
        ),
        ...(
          title ? {
            name: rec.metadata.name || title,
            title,
          } : {}
        ),
        rel: makeRel(input[idx].relation_kind || rec.rel || 'item', ctx.kind),
        ...(Object.keys(properties).length > 0 ? (ctx.forceProperties === false ? properties : { properties }) : {}),
      });
    },
  );
};


const genResourceKindLinks = async (ctx) => {
  const td = await describeTables(true);
  return cpMap(
    td.anchors,
    async ({ kind, kinds }) => {
      const url = new URL(
        [
          ctx.baseUri,
          'resources',
          kind,
        ].join('/') + ctx.url.search,
      );
      return {
        href: url.href.split('?')[0] + ctx.url.search,
        // https://json-schema.org/draft/2019-09/json-schema-hypermedia.html#rfc.section.6.2.3
        rel: 'collection',
        title: kind ? capitalize(pluralize.plural(
          `${kind}`
            .replace(/_/uig, ' '))) : kinds.join(' -[to]-> '),
        properties: {
          numberOfItems: await countAnchors(kind),
        },
        type: OPDS2_CONFIG.defaultMediaType,
      };
    },
  );
};

const countResourceChildren = async (kind, source, key) => {
  const db = await getDb();
  const dbEntities = await describeDbEntities();
  const dbRelations = Object.keys(dbEntities).sort().reduce(
    (a, k) => ([
      ...a,
      ...Object.values(dbEntities[k].outgoing || {}).filter(({ table }) => table).map(
        ({ table }) => table,
      ),
    ]),
    [],
  );
  const q = `SELECT sum(cts.count) as count FROM (
        ${dbRelations.map(
    (tn) =>
      `SELECT COUNT(*) AS count FROM ${tn} ${
        source ? `WHERE 
                (source_from=$<source> ${key ? ` AND key_from=$<key>` : ''})
                OR
                (source_to=$<source> ${key ? ` AND key_to=$<key>` : ''})
                ` : ''
      }
              GROUP BY (source_from, key_from, source_to, key_to, provider)`,
  ).join(' UNION ALL ')
  }) cts;`;
  return dbRelations.length > 0 ? parseInt(
    (await db.one(q, {
        source,
        key,
      })
    ).count, 10) : 0;
};

module.exports = {
  countResourceChildren,
  isPublicationKind,
  dbToLinks,
  // renderPublication,
  getRelations,
  sortLinks,
  getRecordUrl,
  convertRecords,
  makeRel,
  joinUriParts,
  trimSlashes,
  genResourceKindLinks,
  sanitizeLink,
};
