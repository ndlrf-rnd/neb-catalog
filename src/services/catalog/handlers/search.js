const fetch = require('node-fetch');
const { omit } = require('../../../utils');
const { mapValues } = require('../../../utils');
const { joinUriParts } = require('../../../utils');
const {
  OPDS2_CONFIG,
  DEFAULT_SEARCH_INDEX,
  DEFAULT_SEARCH_SERVER_OPTIONS,
} = require('../../../constants');
const { error, debug, pick, cpMap } = require('../../../utils');
const { sendResponse } = require('../formatResponse');
const { ___ } = require('../../../i18n/i18n');

const getSearch = async (req, res) => {
  const index = req.query.index || DEFAULT_SEARCH_INDEX;

  const opts = DEFAULT_SEARCH_SERVER_OPTIONS[index] || DEFAULT_SEARCH_SERVER_OPTIONS[DEFAULT_SEARCH_INDEX];
  const url = new URL(opts.baseUri);
  const hrefSchema = opts.schema.hrefSchema;
  const queryParams = Object.keys(hrefSchema).sort().reduce(
    (acc, paramName) => {
      const paramValue = (typeof req.query[paramName] !== 'undefined')
        ? req.query[paramName]
        : hrefSchema[paramName].default;
      if (typeof paramValue !== 'undefined') {
        return {
          ...acc,
          [paramName]: (hrefSchema[paramName].type === 'integer')
            ? parseInt(paramValue, 10)
            : (
              (hrefSchema[paramName].type === 'float')
                ? parseFloat(paramValue)
                : paramValue
            ),
        };
      } else {
        return acc;
      }
    },
    {},
  );
  Object.keys(queryParams).sort().forEach(
    (paramName) => {
      url.searchParams.set(paramName, queryParams[paramName]);
    },
  );

  debug(`[CATALOG:SEARCH:${index}] URL: ${url} Query: "${JSON.stringify(url.searchParams)}"`);
  const metadata = {
    title: ___('Search results'),
    ...url.searchParams,
  };
  try {
    const backendResponse = await (await fetch(url)).json();
    debug(`[CATALOG:SEARCH:${index}]: ${JSON.stringify(backendResponse)}`);
    console.log(backendResponse)
    const responseData = {
        links: [
          {
            title: metadata.title,
            rel: 'self',
            href: req.ctx.url.toString(),
          },
        ],
        publications: await cpMap(
          backendResponse.groups.filter(
            group => group.links.length > 0
          ),
          async (group) => ({
            ...group,
            links: await Promise.all(
              group.links.map(
              async rec => {
                const url = joinUriParts(OPDS2_CONFIG.baseUri, 'resources', rec['@id']);
                const catalogRec = await (await fetch(url)).json();
                debug(`[CATALOG:SEARCH:RESULT] ${url} ${catalogRec}`);
                return catalogRec.error ? catalogRec : {
                  ...catalogRec,
                  ...pick(rec, ['rank', 'distance']),
                  fields: mapValues(
                    omit(rec, ['@id', 'href', 'rank', 'distance', 'rel']),
                    v => Array.isArray(v) ? ((v.length > 1) ? v : v[0]) : v,
                  ),
                };
              })
            )
          })
        ),
      metadata: {
        proxyRequest: req.query,
        indexRequest: queryParams,
        indexResponse: backendResponse.metadata,
        index,
        url,
        indexProcessingTime: backendResponse.metadata.processingTimeSec,
      },
    };
    sendResponse(200, req, res, responseData);
  } catch (e) {
    error(e);
    sendResponse(500, req, res, e);
  }
};
module.exports = { getSearch };
