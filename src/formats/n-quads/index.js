const { sortBy } = require('../../utils');
const { cpMap } = require('../../utils');
const { info, omit } = require('../../utils');
const { jsonParseSafe } = require('../../utils');
const { defaults } = require('../../utils');
const { JSONLD_MEDIA_TYPE } = require('../jsonld/constants');
const { OPDS2_MEDIA_TYPE } = require('../opds2/constants');
const { StreamParser, Store, Writer } = require('n3');
const { JsonLdSerializer } = require('jsonld-streaming-serializer');
const {
  error,
  forceArray,
  set,
  get,
  debug,
  sanitizeEntityKind,
} = require('../../utils');

const {
  N_QUADS_ENCODING,
  N_QUADS_EXTENSION,
  N_QUADS_MEDIA_TYPE,
} = require('./constants');

/*
  Partial SKOS Fields index:

  skos:prefLabel
  skos:altLabel
  skos:hiddenLabel

  skos:semanticRelation
  skos:broader
  skos:narrower
  skos:related
  skos:broaderTransitive
  skos:narrowerTransitive

  skos:Collection
  skos:OrderedCollection
  skos:member
  skos:memberList

  skos:mappingRelation
  skos:closeMatch
  skos:exactMatch
  skos:broadMatch
  skos:narrowMatch
  skos:relatedMatch
*/

// const NS_TO_URL = {
// 'ore': 'http://www.openarchives.org/ore/terms/',
// 'skos': 'http://www.w3.org/2004/02/skos/core#',
// 'dc': 'http://purl.org/dc/elements/1.1/',
// 'edm': 'http://www.europeana.eu/schemas/edm/',
// 'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
// 'dcterms': 'http://purl.org/dc/terms/',
// 'foaf': 'http://xmlns.com/foaf/0.1/',
// 'geo': 'http://www.w3.org/2003/01/geo/wgs84_pos#',
// 'bbk': 'https://lod.rsl.ru/bbkgsk/concepts#',
// 'udc': 'http://udcdata.info/',
// };

const URL_TO_NS = {
  'http://www.openarchives.org/ore/terms/': 'ore',
  'http://www.w3.org/2004/02/skos/core#': 'skos',
  'http://purl.org/dc/elements/1.1/': 'dc',
  'http://www.europeana.eu/schemas/edm/': 'edm',
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf',
  'http://purl.org/dc/terms/': 'dcterms',
  'http://xmlns.com/foaf/0.1/': 'foaf',
  'http://www.w3.org/2003/01/geo/wgs84_pos#': 'geo',

  'http://lod.rsl.ru/bbkgsk/concepts/': 'bbk',
  'http://10.250.98.18:8080/fuseki/bbk#': 'bbk',
  'http://udcdata.info/': 'udc',
};
/*
"@context": {
    "ore": "http://www.openarchives.org/ore/terms/",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "dc": "http://purl.org/dc/elements/1.1/",
    "edm": "http://www.europeana.eu/schemas/edm/",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "dcterms": "http://purl.org/dc/terms/",
    "foaf": "http://xmlns.com/foaf/0.1/",
    "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#"
  },
  "@graph": [
    {
      "@id": "http://data.europeana.eu/aggregation/europeana/09102/_CM_0839888",
      "@type": "edm:EuropeanaAggregation",
      "dc:creator": "Europeana",
      "edm:aggregatedCHO": {
        "@id": "http://data.europeana.eu/item/09102/_CM_0839888"
      },
      "edm:collectionName": "09102_Ag_EU_MIMO_ESE",
      "edm:country": "Europe",
      "edm:landingPage": {
        "@id": "http://www.europeana.eu/portal/record/09102/_CM_0839888.html"
      },
      "edm:language": "mul",
      "edm:rights": {
        "@id": "http://creativecommons.org/licenses/by-nc-sa/3.0/"
      }
    },
    {
      "@id": "http://data.europeana.eu/aggregation/provider/09102/_CM_0839888",
      "@type": "ore:Aggregation",
      ...
    },
    {
      "@id": "http://data.europeana.eu/item/09102/_CM_0839888",
      "@type": "edm:ProvidedCHO"
    },
    {
      "@id": "http://data.europeana.eu/proxy/europeana/09102/_CM_0839888",
      "@type": "ore:Proxy",
      ...
    },
    {
      "@id": "http://data.europeana.eu/proxy/provider/09102/_CM_0839888",
      "@type": "ore:Proxy",
      ...
    },
    {
      "@id": "http://mediatheque.cite-musique.fr/masc/play.asp?ID=0839888",
      "@type": "edm:WebResource"
    },
    {
      "@id": "http://semium.org/time/1910",
      "@type": "edm:TimeSpan",
      ...
    },
    {
      "@id": "http://semium.org/time/19xx_1_third",
      "@type": "edm:TimeSpan",
      ...
    },
    {
      "@id": "http://sws.geonames.org/2950159",
      "@type": "edm:Place",
      ...
    },
    {
      "@id": "http://www.geonames.org/2950159",
      "@type": "edm:Place",
      ...
    },
    {
      "@id": "http://www.mimo-db.eu/InstrumentsKeywords/4495",
      "@type": "skos:Concept",
      ...
    },
    {
      "@id": "http://www.mimo-db.eu/media/MF-GET/IMAGE/MFIM000024482.jpg",
      "@type": "edm:WebResource",
      ...
    }
  ]
}
 */
const compactNs = (input) => {
  let result = decodeURIComponent(input);
  Object.keys(URL_TO_NS).sort().forEach(url => {
    result = result.replace(url, `${URL_TO_NS[url]}:`);
  });
  return result;
};

const urlToSourceKey = (str) => {
  str = compactNs(str);
  const kind = sanitizeEntityKind(str.match('udc-schema') ? 'skos:ConceptScheme' : 'skos:Concept');
  if (str.match(/^https?:\/\//)) {
    const [source, ...keyParts] = str.replace(/^https?:\/\//uig, '').toLocaleLowerCase().split('/');
    return {
      kind,
      source,
      key: keyParts.join('/'),
    };
  } else if (str.match(/^[^:]+:.*$/)) {
    const [source, ...keyParts] = str.toLocaleLowerCase().split(':');
    return {
      kind,
      source,
      key: keyParts.join(':'),
    };
  } else {
    return {
      kind,
      source: null,
      key: str,
    };
  }
};

const toEntities = (input, config) => new Promise(
  (resolve, reject) => {
    const streamParser = new StreamParser({ format: N_QUADS_MEDIA_TYPE });
    let tupleSerial = 0;
    let subjectSerial = 0;
    let prevSubjectId = null;
    let results = [];
    let subjAcc = [];
    let acc = [];
    const processAcc = (subjectId) => new Promise((res, rej) => {
      if (subjAcc.length > 0) {


        const writer = new Writer({
          end: false,
          format: N_QUADS_MEDIA_TYPE,
        });
        writer.addQuads(subjAcc);
        writer.end(
          (err, result) => {
            if (subjAcc.length > 0) {
              if (err) {
                return rej(err);
              }
              const { source, key, kind } = urlToSourceKey(subjectId);
              results.push({
                source,
                key,
                kind,
                record: result,
                mediaType: N_QUADS_MEDIA_TYPE,
              });
              subjectSerial += 1;
              subjAcc = [];
              if (subjectSerial % 1000 === 0) {
                info(`[IMPORT:N-QUADS] ${subjectSerial} subjects processed so far`);
              }
              res();
            }
          },
        );
      }
    });
    streamParser.on(
      'data', async (parsed) => {
        acc.push(parsed);
        tupleSerial += 1;
        if (tupleSerial % 10000 === 0) {
          info(`[IMPORT:N-QUADS] ${tupleSerial} tuples processed so far`);
        }
      },
    );

    streamParser.on('error', (e) => {
      error(`[IMPORT:N-QUADS] Error: ${e}`);
      reject(e);
    });
    streamParser.on(
      'end',
      async () => {
        info(`[IMPORT:N-QUAD] Sorting quads`)
        acc = sortBy(acc,rec=>rec.subject.id)
        info(`[IMPORT:N-QUAD] Done with Sorting quads`)
        await cpMap(
          acc,
          async parsed => {
            subjAcc.push(parsed);
            const subjectId = parsed.subject.id;
            if (prevSubjectId !== subjectId) {
              await processAcc(subjectId);
            }
            prevSubjectId = subjectId;
            tupleSerial += 1;
          },
        );
        await processAcc(prevSubjectId, true);
        if (subjectSerial % 1000 > 0) {

          info(`[IMPORT:N-QUADS] Processing completed. ${tupleSerial} tuples and ${subjectSerial} subjects processed in total.`);
        }

        resolve(results);
      },
    );

    if (input.pipe) {
      debug(`[IMPORT:N-QUAD] Piping input ${input.source}`);
      const sp = input.pipe(streamParser);
    } else {
      debug(`[IMPORT:N-QUAD] Reading input ${input.length}`);
      streamParser.write(input);
      streamParser.end();
    }
  },
);

const toOpds2 = (input, config) => new Promise(
  (resolve, reject) => {
    const streamParser = new StreamParser({ format: N_QUADS_MEDIA_TYPE });
    let subject;
    let metadata = {};
    streamParser.on(
      'data',
      (parsed) => {
        subject = subject || parsed.subject.id.toString();
        const predicate = compactNs(parsed.predicate.id.toString());
        const language = parsed.object.language ? parsed.object.language.toString() : null;
        const objStr = compactNs(parsed.object.value.toString());
        if (!metadata[predicate]) {

          metadata[predicate] = objStr;
        } else if (language) {
          set(metadata, [predicate, language], objStr);

        } else {
          metadata[predicate] = forceArray(metadata[predicate]).concat([objStr]);

        }
      },
    );
    streamParser.on(
      'end',
      () => {
        const name = metadata['skos:prefLabel'] || metadata['skos:notation'] || metadata['rdf:type'] || (subject ? urlToSourceKey(subject.id).key : null);
        const title = get(metadata, ['skos:prefLabel', 'ru']) || get(metadata, ['skos:prefLabel', 'en']) || get(metadata, ['skos:prefLabel']) || metadata['skos:notation']  || metadata['rdf:type'] || (subject ? urlToSourceKey(subject.id).key : null);
        resolve(
          {
            ...omit(metadata, ['udc:udc-schema#applicationNote', 'rdf:type']),
            '@type': metadata['rdf:type'],
            '@id': compactNs(subject),
            type: N_QUADS_MEDIA_TYPE,
            description: metadata['udc:udc-schema#applicationNote'],
            ...(name ? {name} : {}),
            ...(title ? {title} : {}),
            href: subject,
          },
        );
      },
    );
    if (input.pipe) {
      debug(`[IMPORT:N-QUAD] Piping input ${input.source}`);
      const sp = input.pipe(streamParser);
    } else {
      debug(`[IMPORT:N-QUAD] Reading input ${input.length}`);
      streamParser.write(input);
      streamParser.end();
    }
  },
);

const toJsonLd = (input, config = {}) => new Promise(
  (resolve, reject) => {
    config = defaults(config || {}, { space: '  ' });
    const streamParser = new StreamParser({ format: N_QUADS_MEDIA_TYPE });

    const serializer = new JsonLdSerializer(config);
    if (input.pipe) {
      debug(`[IMPORT:N-QUAD] Piping input ${input.source}`);
      input.pipe(streamParser);
    } else {
      debug(`[IMPORT:N-QUAD] Reading input ${input.length}`);
      streamParser.write(input);
      streamParser.end();
    }
    let results = '';
    serializer
      .on('data', rec => {
        results += rec;
      })
      .on('error', reject)
      .on('end', () => {
        resolve(jsonParseSafe(results));
      });
    streamParser.pipe(serializer);
  },
);

module.exports = {
  extension: N_QUADS_EXTENSION,
  mediaType: N_QUADS_MEDIA_TYPE,
  encoding: N_QUADS_ENCODING,
  to: {
    [OPDS2_MEDIA_TYPE]: toOpds2,
    [JSONLD_MEDIA_TYPE]: toJsonLd,
  },
  toEntities,
};
