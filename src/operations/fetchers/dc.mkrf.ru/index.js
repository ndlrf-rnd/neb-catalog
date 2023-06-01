/* eslint-disable quote-props,max-len */
// FIXME: Get rid of XML
// xml in dev dependencies
const XML = require('xml');
const { getDb } = require('../../../dao/db-lifecycle');
const { j2x } = require('../../../utils/x2j');
const { ENTITY_NAME } = require('../../../dao/queries');

const { hash } = require('../../../utils');
const { makeRelationStr } = require('./../../../formats/marc');

const c = {
  port: 3003,
  feedLang: 'ru',
  feed: {
    uri: '/epub_content/epub_library.opds',
    id: 'NEB_EPUB_SDK_DEV_LOCAL_OPDS',
    title: 'NEB EPUB SDK local dev OPDS feed',
    lang: 'ru',
  },
  defaultCoverImage: '/images/default_cover_01.png',
  x2jOptions: {
    ignoreComment: false,
    alwaysRoot: false,
    compact: false,
    alwaysChildren: true,
    alwaysArray: true,
    fullTagEmptyElement: true,
    trim: false,
    textKey: 'text',
    attributesKey: 'attributes',
    commentKey: 'comment',
  },
  outputmediaType: 'application/xml',
};

const formatList = (list) => ({
  type: 'element',
  name: 'entry',
  elements: [
    {
      type: 'element',
      name: 'id',
      elements: [
        {
          type: 'text',
          text: list.slug,
        },
      ],
    },
    {
      type: 'element',
      name: 'title',
      elements: [
        {
          type: 'text',
          text: list.title,
        },
      ],
    },
    {
      type: 'element',
      name: 'updayed',
      elements: [
        {
          type: 'text',
          text: new Date().toISOString(),
        },
      ],
    },
    {
      type: 'element',
      name: 'link',
      attributes: {
        rel: 'subsection',
        href: `opds/feeds/${list.id}`,
        type: 'application/atom+xml;profile=opds;kind=navigation',
      },
    },
  ],
});

const renderOpdsRoot = async (options = c.opdsServer) => {
  const o = { ...c, ...options };
  const lists = await (await getDb()).manyOrNone(
    `SELECT * FROM ${ENTITY_NAME('collection')}`,
  );
  const tree = {
    type: 'element',
    name: 'feed',
    attributes: {
      'xml:lang': o.feedLang,
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xmlns:odl': 'http://opds-spec.org/odl',
      'xmlns:dcterms': 'http://purl.org/dc/terms/',
      xmlns: 'http://www.w3.org/2005/Atom',
      'xmlns:app': 'http://www.w3.org/2007/app',
      'xmlns:opensearch': 'http://a9.com/-/spec/opensearch/1.1/',
      'xmlns:thr': 'http://purl.org/syndication/thread/1.0',
      'xmlns:opds': 'http://opds-spec.org/2010/catalog',
    },
    elements: [
      {
        type: 'element',
        name: 'id',
        elements: [
          {
            type: 'text',
            text: o.feed.id,
          },
        ],
      },
      // #TODO: Recent Date of modification of epub in folder
      {
        type: 'element',
        name: 'updated',
        elements: [
          {
            type: 'text',
            text: new Date().toISOString(),
          },
        ],
      },
      {
        type: 'element',
        name: 'title',
        elements: [
          {
            type: 'text',
            text: o.feed.title,
          },
        ],
      },
      {
        type: 'element',
        name: 'link',
        attributes: {
          rel: 'start',
          href: 'opds/root.xml',
          type: 'application/atom+xml;profile=opds;kind=navigation',
        },
      },
      {
        type: 'element',
        name: 'link',
        attributes: {
          rel: 'start',
          href: 'opds/root.xml',
          type: 'application/atom+xml;profile=opds;kind=navigation',
        },
      },
      ...lists.map(formatList),
    ],
  };
  if (o.outputmediaType === 'application/xml') {
    return j2x(tree);
  } else {
    return tree;
  }
};
// FIXME: Remove lists entity
const formatEntry = (entry) => {
  const record = entry.schema_uri.match(/rsl-marc21-bibliographic/giu)
    ? convert(entry.record, 'object:opds2')
    : entry.record;
  return {
    type: 'element',
    name: 'entry',
    elements: [
      {
        type: 'element',
        name: 'title',
        elements: [
          {
            type: 'text',
            text: makeRelationStr(entry.source, entry.key),
          },
        ],
      },
      {
        type: 'element',
        name: 'id',
        elements: [
          {
            type: 'text',
            text: `marc:${makeRelationStr(entry.source, entry.key)}`,
          },
        ],
      },
      // {
      //   type: 'element',
      //   name: 'schemaUri',
      //   elements: [
      //     {
      //       type: 'text',
      //       text: entry.schema_uri,
      //     },
      //   ],
      // },
      {
        name: 'content',
        type: 'element',

        attributes: {
          type: 'json',
        },
        elements: [
          {
            type: 'text',
            text: record,
          },
        ],
      },
      {
        type: 'element',
        name: 'id',
        elements: [
          {
            type: 'text',
            text: `urn:uuid:${hash(
              makeRelationStr(entry.source, entry.key),
            )}`,
          },
        ],
      },
      {
        type: 'element',
        name: 'updated',
        elements: [
          {
            type: 'text',
            text: new Date(
              entry.time_sys.split(',')[0].replace(/["[\]()]+/giu, ''),
            ).toISOString(),
          },
        ],
      },
    ],
  };
};

const renderOpdsFeed = async (slug, options ) => {
  const o = { ...c, ...options };
  const entries = await db.queryEntities({
    ...options,
    kind: 'instance',
  });
  const tree = {
    type: 'element',
    name: 'feed',
    attributes: {
      'xml:lang': o.feedLang,
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xmlns:odl': 'http://opds-spec.org/odl',
      'xmlns:dcterms': 'http://purl.org/dc/terms/',
      xmlns: 'http://www.w3.org/2005/Atom',
      'xmlns:app': 'http://www.w3.org/2007/app',
      'xmlns:opensearch': 'http://a9.com/-/spec/opensearch/1.1/',
      'xmlns:thr': 'http://purl.org/syndication/thread/1.0',
      'xmlns:opds': 'http://opds-spec.org/2010/catalog',
    },
    elements: [
      {
        type: 'element',
        name: 'id',
        elements: [
          {
            type: 'text',
            text: o.feed.id,
          },
        ],
      },
      // #TODO: Recent Date of modification of epub in folder
      {
        type: 'element',
        name: 'updated',
        elements: [
          {
            type: 'text',
            text: new Date().toISOString(),
          },
        ],
      },
      {
        type: 'element',
        name: 'title',
        elements: [
          {
            type: 'text',
            text: o.feed.title,
          },
        ],
      },

      {
        name: 'link',
        type: 'element',
        attributes: {
          rel: 'start',
          href: 'opds/root.xml',
          type: 'application/atom+xml;profile=opds;kind=navigation',
        },
      },
      {
        type: 'element',
        name: 'link',
        attributes: {
          rel: 'self',
          href: 'opds/root.xml',
          type: 'application/atom+xml;profile=opds;kind=navigation',
        },
      },
      ...entries.map(formatEntry),
    ],
  };
  if (o.output === 'application/xml') {
    return XML(tree, o.xmlRenderOptions);
  }
  return tree;
};

module.exports = {
  renderOpdsRoot,
  renderOpdsFeed,
};
