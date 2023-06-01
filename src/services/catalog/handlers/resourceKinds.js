const {
  trimSlashes,
  sortLinks,
  genResourceKindLinks,
  sanitizeLink,
} = require('../common');
const { info, forceArray } = require('../../../utils');
const { sendResponse } = require('../formatResponse');
const { ___ } = require('../../../i18n/i18n');

/**
 *
 * @param ctx {{
 *  baseUri: string,
 *  numberOfItems: number,
 *  url: string,
 * }}
 * @returns {Promise<{
 *    metadata: {
 *      identifier: string,
 *      numberOfItems: number,
 *      '@type': string,
 *      modified: string,
 *      '@id': string,
 *      title: (string|*)
 *    },
 *    navigation: Array<>?,
 *    links: Array<>?
 *  }>}
 */
const getResourceKindsGroup = async (ctx) => {
  info('[OPDS2:getResourceKindsGroup] /',`${ctx.url}`);
  const identifier = `${trimSlashes(ctx.baseUri)}/resources`;
  return {
    metadata: {
      title: ___('Records by kind'),
      numberOfItems: ctx.numberOfItems,
      identifier,
      '@id': identifier,
      '@type': 'https://schema.org/Collection',
    },
    links: sortLinks(
      [
        {
          rel: 'self',
          title: ___('JSON/OPDS2 format'),
          href: `${ctx.url}`,
        },
      ],
      ctx.baseUri,
    ),
    navigation: forceArray(await genResourceKindLinks(ctx)).map(
      l => sanitizeLink(l, ctx.baseUri),
    ),
  };
};

const getResourceKindsList = async (req, res) => {
  return sendResponse(
    200,
    req,
    res,
    await getResourceKindsGroup(req.ctx),
  );
};
module.exports = {
  getResourceKindsList,
  getResourceKindsGroup,
};
