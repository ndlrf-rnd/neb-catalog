// const canonicalizeRdf = require('rdf-canonize');
// const jsonld = require('jsonld');
const {
  RDF_NS,
  RDF_FORMAT,
  RDF_ENCODING,
  RDF_MEDIA_TYPE,
  RDF_EXTENSION,
  RDF_NORMALIZATION_OPTIONS,
} = require('./constants');

module.exports = {
  extension: RDF_EXTENSION,
  ns: RDF_NS,
  mediaType: RDF_MEDIA_TYPE,
  encoding: RDF_ENCODING,
  format: RDF_FORMAT,
  // normalize: async (
  //   dataset,
  //   options = RDF_NORMALIZATION_OPTIONS
  // ) => new Promise(
  //   (resolve, reject) => canonicalizeRdf(
  //     dataset,
  //     options,
  //     (err, canonicalXml) => {
  //       if (err) {
  //         reject(err);
  //       } else {
  //         resolve(canonicalXml);
  //       }
  //     },
  //   ),
  // ),
  // toObjects: async doc => await jsonld.fromRDF(doc, { format: RDF_FORMAT }),
  // fromObjects: async doc => await jsonld.toRDF(doc, { format: RDF_FORMAT }),
};
