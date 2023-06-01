const fs = require('fs');
const path = require('path');
const $RefParser = require('@apidevtools/json-schema-ref-parser');
const formats = require('../../../formats');
const { sendResponse } = require('../formatResponse');
const { CATALOG_API_SCHEMAS_ROOT } = require('../../../formats/opds2/constants');
const { OPDS2_CONFIG } = require('../../../constants');
const { ___ } = require('../../../i18n/i18n');

const { debug, error, info } = require('../../../utils');

let DYNAMIC_SCHEMAS = {};
const loadSchema = async (schema) => {
  const readFileFn = (file) => {
    const p = (
      (
        file.url.startsWith('/schemas') ?
          path.join(
            CATALOG_API_SCHEMAS_ROOT,
            file.url,
          )
          : file.url
      ).replace('/schemas/schemas', '/schemas')
    ).split('?')[0];
    info(`Loading schema: ${p}`);

    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } else {
      throw new Error(`Schema ${schema} not found`);
    }
  };
  const hrefResolver = {
    order: 1,
    canRead: true,
    read: readFileFn,
  };
  // noinspection JSCheckFunctionSignatures
  const parser = new $RefParser({
    resolve: {
      file: hrefResolver,
      http: hrefResolver,
    },
  });

  return parser.parse(readFileFn({ url: schema }), {});
};

//TODO: Remove hardcode
DYNAMIC_SCHEMAS = {
  '/schemas/media-types.json': async () => ({
    '@context': [
      'https://schema.org/encodingFormat',
      {
        'language': 'en-US',
      },
    ],
    $id: 'media-types.json',
    $schema: 'https://json-schema.org/draft/2019-09/schema',
    type: 'string',
    title: 'IANA Media types',
    description: 'A [media type](https://www.iana.org/assignments/media-types/media-types.xhtml) (formerly known as MIME type) is a two-part identifier for file formats and format contents transmitted on the Internet.',
    enum: Object.keys(formats).sort().map(mediaType => mediaType),
    enumDescription: Object.keys(formats).sort().map(mediaType => formats[mediaType].extension),
    default: OPDS2_CONFIG.defaultMediaType,
  }),
  '/schemas/extensions.json': async () => {
    const extensions = Object.keys(formats).sort().reduce((a, o) => ({
      ...a,
      [formats[o].extension]: [...(a[formats[o].extension] || []), formats[o].mediaType],
    }), {});
    return {
      $id: 'extensions.json',
      $schema: 'https://json-schema.org/draft/2019-09/schema',
      type: 'string',
      title: ___('File extension'),
      pattern: '[a-zA-Z0-9\-]{1,128}',
      enum: Object.keys(extensions).sort(),
      enumDescription: Object.keys(extensions).sort().map(ext => extensions[ext].join(' ')),
      default: OPDS2_CONFIG.defaultExtension,
      '@context': [
        'https://schema.org/encodingFormat',
        'https://schema.org/alternateName',
        {
          'language': 'en-US',
        },
      ],
    };
  },
};

const getSchemas = async (req, res) => {
  try {
    const url = new URL(req.url, OPDS2_CONFIG.baseUri);
    debug('[GET] getSchemas', req.url, url.pathname);
    const keys = Object.keys(DYNAMIC_SCHEMAS).sort();
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (!url.pathname.startsWith(key)) {
        continue;
      }
      const schema = await DYNAMIC_SCHEMAS[key](req);
      return res.status(200).send(schema);
    }
    const schema = await loadSchema(req.url, req);
    if (!schema) {
      return sendResponse(404, req, res, {
          error: `[SCHEMA] Schema not found: ${schema}`,
        },
      );
    }
    res.status(200).send(schema);

  } catch (err) {
    error(err);
    res.status(500).send({ metadata: { error: err.message } });
  }
};

module.exports = {
  getSchemas,
};
