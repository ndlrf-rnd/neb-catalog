const {
  BFLC_RDF_SCHEMA,
  BIBFRAME_RDF_SCHEMA,
} = require('./constants');
const RdfFormat = require('../rdf');

module.exports = {
  ...RdfFormat,
  schema: [
    BIBFRAME_RDF_SCHEMA,
    BFLC_RDF_SCHEMA,
  ],
  is: (input) => (typeof input === 'string') && (input.match(/xmlns(:bf)? *= *"?https?:\/\/id.loc.gov\/ontologies\/bibframe"?/uig)),
};