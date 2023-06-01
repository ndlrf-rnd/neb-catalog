const {
  forceArray,
  isEmpty,
} = require('./../utils');


// Import formats
const jes = require('./ras.jes.su');
const knpamRusnebRu = require('./knpam.rusneb.ru');
const opds2 = require('./opds2');
const litresRu = require('./litres.ru');
const tsv = require('./tsv');
const atom = require('./atom');
const rdf = require('./rdf');
const json = require('./json');
const jsonLd = require('./jsonld');
const marc = require('./marc');
const marcxml = require('./marcxml');
const onix = require('./onix');
const xml = require('./xml');
const yaml = require('./yaml');
const html = require('./html');
const nQuads = require('./n-quads');
const { DEFAULT_MEDIA_TYPE } = require('../constants');

const formats = [
  atom,
  jes,
  json,
  jsonLd,
  knpamRusnebRu,
  litresRu,
  marc,
  marcxml,
  onix,
  opds2,
  tsv,
  xml,
  yaml,
  html,
  rdf,
  nQuads,
].reduce(
  (a, format) => {
    let intf;
    intf = {
      ...format,
      // toObjects: (input) => ((typeof format.toObjects === 'function') ? format.toObjects : forceArray)(input),
      mediaType: isEmpty(format.mediaType)
        ? DEFAULT_MEDIA_TYPE
        : format.mediaType,
      toEntities: async (inputStrOrBuffer, config) => {

        const entitiesOrRelations = (typeof format.toEntities === 'function')
          ? await format.toEntities(inputStrOrBuffer, config)
          : inputStrOrBuffer;
        return forceArray(entitiesOrRelations).map(
          entityOrRelation => {
            return entityOrRelation.kind
              ? ({
                ...entityOrRelation,
                mediaType: entityOrRelation.mediaType || entityOrRelation.media_type || format.mediaType || format.media_type,
              })
              : entityOrRelation
          },
        );
      },
    };
    return {
      ...a,
      [format.mediaType]: intf,
    };
  },
  {},
);

const extensions = Object.keys(formats).sort().reduce((a, o) => ({
  ...a,
  [formats[o].extension]: [...(a[formats[o].extension] || []), formats[o].mediaType],
}), {});

module.exports = {
  ...formats,
  extensions,
};
