const path = require('path');

const BIBFRAME_RDF_SCHEMA = {
  path: path.join(__dirname, 'schemas/bibframe.rdf'),
  url: 'http://id.loc.gov/ontologies/bibframe/',
  ns: {
    'xml:base': 'http://id.loc.gov/ontologies/bibframe/',
    'xmlns:bf': 'http://id.loc.gov/ontologies/bibframe/',
    'xmlns:dcterms': 'http://purl.org/dc/terms/',
    'xmlns:owl': 'http://www.w3.org/2002/07/owl#',
    'xmlns:rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'xmlns:rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'xmlns:skos': 'http://www.w3.org/2004/02/skos/core#',
  },
};

const BFLC_RDF_SCHEMA = {
  path: path.join(__dirname, 'schemas/bflc.rdf'),
  url: 'http://id.loc.gov/ontologies/bflc/',
  ns: {
    'xml:base': 'http://id.loc.gov/ontologies/bflc/',
    'xmlns:bf': 'http://id.loc.gov/ontologies/bibframe/',
    'xmlns:dcterms': 'http://purl.org/dc/terms/',
    'xmlns:owl': 'http://www.w3.org/2002/07/owl#',
    'xmlns:rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'xmlns:rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'xmlns:skos': 'http://www.w3.org/2004/02/skos/core#',
  },
};


module.exports = {
  BIBFRAME_RDF_SCHEMA,
  BFLC_RDF_SCHEMA,
};