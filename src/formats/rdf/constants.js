const RDF_MEDIA_TYPE = 'application/rdf+xml';
const RDF_ENCODING = 'utf-8';
const RDF_EXTENSION = 'rdf';
const RDF_FORMAT = 'application/n-quads';
const RDF_ALGORITHM = 'URDNA2015';
const RDF_NS = { xmlns: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' };
const RDF_NORMALIZATION_OPTIONS = { algorithm: RDF_ALGORITHM };

module.exports = {
  RDF_NS,
  RDF_ALGORITHM,
  RDF_MEDIA_TYPE,
  RDF_ENCODING,
  RDF_EXTENSION,
  RDF_FORMAT,
  RDF_NORMALIZATION_OPTIONS,
};