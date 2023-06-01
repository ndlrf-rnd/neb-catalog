const { CATALOG_LOGO_GROUP } = require('../groups/logoGroup');
const { resourceOfSameKindGroup } = require('../groups/resourcesOfSameKindGroup');
const { OPDS2_CONFIG } = require('../../../constants');
const { OPDS2_MEDIA_TYPE } = require('../../../formats/opds2/constants');
const { getResourceKindsGroup } = require('./resourceKinds');

const { _title } = require('../../../i18n/i18n');
const { sendResponse } = require('../formatResponse');
const { ___ } = require('../../../i18n/i18n');
const { debug, error, omit } = require('../../../utils');

const handlerHome = async (req, res) => {
  debug('[GET:HOME] /home', `${req.url}`);
  const groups = [];

  // Collections
  try {
    groups.push(
      await resourceOfSameKindGroup({
        ...req.ctx,
        kind: 'collection',
      }),
    );
  } catch (e) {
    error(e);
  }

  // Resources
  try {
    groups.push(
      await getResourceKindsGroup(req.ctx),
    );
  } catch (e) {
    error(e);
  }

  groups.push(CATALOG_LOGO_GROUP);

  const responseData = {
  "@context": [
    "https://readium.org/webpub-manifest/context.jsonld"
  ],
  "metadata": {
 ..._title('NEL RF - SEED Catalog'),
      description: ___('Catalog of Data Integration System of Russian National electronic library'),
    "order": "desc"
  },
  "links": [
    {
      "rel": "self",
      "href": "/index.json",
      "type": OPDS2_MEDIA_TYPE
    },
    {
      'rel': 'schema',
      "href": "/schemas/hyper-schema.json",
      "title": "SEED JSON (Hyper-)Schema"
    },
    {
      "href": "https://rusneb.ru",
      "title": "Russian national digital library"
    },
    {
      "href": "https://rsl.ru",
      "title": "Russian state library"
    }
  ],
    groups: groups.map(g => omit(g, ['links'])),
  };
  sendResponse(200, req, res, responseData);
};

module.exports = {
  handlerHome,
};

