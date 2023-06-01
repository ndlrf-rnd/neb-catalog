/**
 * RDF:  http://www.w3.org/2000/01/rdf-schema#
 */
const RdfFormat = require('../../formats/rdf');


const RDF_SCHEMA = {
  path: path.join(__dirname, 'schemas/rdf-schema.rdf'),
  url: 'http://www.w3.org/2000/01/rdf-schema#',
  ns: {
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    owl: 'http://www.w3.org/2002/07/owl#',
    dc: 'http://purl.org/dc/elements/1.1/',
  },
};



module.exports = {
  ...RdfFormat,
  schema: [
    RDF_SCHEMA,
  ],
  compile: async (schema) => {
    const schemaDoc = await RdfFormat.toObjects(schema);
    return async inputXml => (
      await RdfFormat.toObjects(inputXml)
    ).validate(schemaDoc);
  },
};