const { MARCXML_MEDIA_TYPE } = require('../marcxml/constants');
const { toSlimXml } = require('../marcxml/toSlimXml');
const { uniqBy } = require('../../utils');
const { getRslCollections } = require('./detect');
const { DEFAULT_SOURCE } = require('../../constants');
const { forceArray, flatten, defaults, flattenDeep } = require('../../utils');
const {
  getPhysicalLocationRecord,
  getUrlRecords,
  getKind,
  isMarc,
  getMarcKey,
  getMarcSource,
  detectMarcSchemaUri,
} = require('./detect');
const { marcObjectToJson } = require('../marc/marcObjectToJson');
const { getMarcRecordDates } = require('./dates');

const {
  MARC21_TO_OPDS2_JSONATA,
  MARC_EXTENSION,
  RUSMARC_TO_MARC21_JSONATA,
} = require('./constants');
const { JSON_MEDIA_TYPE } = require('../json/constants');
const { UNIMARC_JSON_SCHEMA_URI } = require('./constants-unimarc');
const { RUSMARC_JSON_SCHEMA_URI } = require('./constants-rusmarc');

const {
  toISO2709,
  fromISO2709,
} = require('./iso2709');
const {
  MARC_ENCODING,
  MARC_RECORD_SEPARATION_CHAR,
  BASIC_ENTITIES,
  MARC_MEDIA_TYPE,

} = require('./constants');

const { JSONLD_MEDIA_TYPE } = require('../jsonld/constants');

const { OPDS2_MEDIA_TYPE } = require('../opds2/constants');

const toEntities = (rawRecord, config) => {
  const objects = forceArray(
    Buffer.isBuffer(rawRecord) || (typeof rawRecord === 'string')
      ? fromISO2709(rawRecord, config)
      : rawRecord,
  );
  const { mediaType, generateCollections } = defaults(config, {
    generateCollections: false,
    mediaType: MARC_MEDIA_TYPE,
  });
  return flatten(
    objects.map(
      (obj) => {
        /*
        http://www.loc.gov/marc/bibliographic/bd001.html
        Contains the control number assigned by the organization creating, using,
        or distributing the record.
        For interchange purposes, documentation of the structure of the control number and input
        conventions should be provided to exchange partners by the organization initiating the
        interchange.
        The MARC code identifying whose system control number is present in field 001
        is contained in field 003 (Control Number Identifier).
        An organization receiving a record may move the incoming control number from field 001
        (and the control number identifier from field 003) to field 035 (System Control Number),
        010 (Library of Congress Control Number),
        or 016 (National Bibliographic Agency Control Number),
        as appropriate, and place its own system control number in field 001
        (and its control number identifier in field 003).
        */
        const marcSchemaUri = detectMarcSchemaUri(obj);
        if (marcSchemaUri) {
          // Works for MARC/RusMARC/UniMarc
          const dates = getMarcRecordDates(obj, marcSchemaUri);
          const source = getMarcSource(obj).toLocaleLowerCase();
          const kind = getKind(obj).toLocaleLowerCase();
          const key = getMarcKey(obj).toLocaleLowerCase();
          const links = flattenDeep(
            getUrlRecords(obj).map(({
              key: key_from,
              source: source_from,
              kind: kind_from,
            }) => ({
              key_from,
              source_from: source_from || DEFAULT_SOURCE,
              kind_from,
              relation_kind: 'relatedTo',
              key_to: key,
              source_to: source,
              kind_to: kind,
              time_source: dates.recordDateStart,
            })),
          );
          const items = flattenDeep(
            uniqBy(
              getPhysicalLocationRecord(obj).filter(
                ({ kind, source, key }) => kind && source && key).map(
                item => ({
                  ...item,
                  // source: item.source ? item.source.toLocaleLowerCase() : null,
                  // key: item.key ? item.key.toLocaleLowerCase() : null,
                  // kind: item.kind ? item.kind.toLocaleLowerCase() : null,
                  mediaType: (mediaType || item.mediaType),
                }),
              ),
              ({ kind, source, key }) => [kind, source, key].join('\t'),
            ).map(
              item => ([
                {
                  ...item,
                  time_source: dates.recordDateStart,
                },
                {
                  kind_from: kind,
                  source_from: source,
                  key_from: key,
                  relation_kind: 'item',
                  kind_to: item.kind,
                  source_to: item.source,
                  key_to: item.key,
                  time_source: dates.recordDateStart,
                },
              ]),
            ),
          );

          let collectionsWithRelations = [];
          if (generateCollections) {
            collectionsWithRelations = flattenDeep(getRslCollections(obj).map(collection => ([
              {
                ...collection,
                time_source: dates.recordDateStart,
              },
              {
                kind_to: kind,
                source_to: source,
                key_to: key,
                relation_kind: 'item',
                kind_from: collection.kind,
                source_from: collection.source,
                key_from: collection.key,

                time_source: dates.recordDateStart,
              },
            ])));
          }
          /*
          Marc LEADER
          06 - Type of record
          u - Unknown
          v - Multipart item holdings
          x - Single-part item holdings
          y - Serial item holdings
           */
          // Example of 852:
          // ##
          //  $aDLC
          //  $bManuscript Division
          //  $eJames Madison Memorial Building, 1st & Independence Ave., S.E., Washington, DC USA
          //  $j4016
          // https://www.loc.gov/marc/holdings/hd852.html
          // 81
          //  $a[location identifier]
          //  $b0131
          //  $p1100064014
          // $."852".{
          //   "organization": $.a ? $marc21OrgCode($.a) : undefined,
          //     "name": $.b or $.c ? $join([$.b, $.c], " ") : undefined,
          //     "stockNumber": $.p ? $.p : undefined,
          //     "shelfMark": $.j ? $.j : undefined
          // },
          // $."851".{
          //   "organization": $.a ? $marc21OrgCode($.a) : undefined,
          //     "name": $.b or $.c ? $join([$.b, $.c], " ") : undefined,
          //     "stockNumber": $.p ? $.p : undefined,
          //     "shelfMark": $.j ? $.j : undefined
          // }
          // Example 856: 3#$alocis.loc.gov$b140.147.254.3$mlconline@loc.gov$t3270$tline mode (e.g., vt100)$vM-F 6:00 a.m.-21:30 p.m. USA EST, Sat. 8:30-17:00 USA EST, Sun. 13:00-17:00 USA EST
          if (kind && source) {
            return [
              ...(
                ([BASIC_ENTITIES.ITEM, BASIC_ENTITIES.URL].indexOf(kind) === -1)
                  ? [
                    {
                      time_source: dates.recordDateStart,
                      kind,
                      key,
                      source,
                      mediaType,
                      record: Buffer.isBuffer(rawRecord) ? rawRecord.toString('utf-8') : rawRecord,
                    },
                  ]
                  : []
              ),
              ...items,
              ...links,
              ...collectionsWithRelations,
            ];
          }
        }
       else {
                return null;
              }
            },
          ),
        ).filter(v => !!v);
      };

      const marcToOpds = (input) => {
        if ((typeof input === 'string') || (Buffer.isBuffer(input))) {
          input = fromISO2709(input);
        }
        const marcObjs = flatten(forceArray(input).map(
          o => {
            const isRusmarc = (detectMarcSchemaUri(o) === RUSMARC_JSON_SCHEMA_URI);
            const isUnimarc = (detectMarcSchemaUri(o) === UNIMARC_JSON_SCHEMA_URI);
            return (isRusmarc || isUnimarc)
              ? RUSMARC_TO_MARC21_JSONATA(forceArray(o).map(marcObjectToJson))
              : forceArray(o).map(marcObjectToJson);
          },
        ));
        return marcObjs.map(MARC21_TO_OPDS2_JSONATA);
      };
      module.exports = {
        // marcObjToEntities: toEntities(),
        endMarker: MARC_RECORD_SEPARATION_CHAR,
        mediaType: MARC_MEDIA_TYPE,
        encoding: MARC_ENCODING,
        extension: MARC_EXTENSION,
        is: isMarc,
        toEntities,
        toObjects: input => fromISO2709(input),
        fromObjects: input => toISO2709(input),
        to: {
          [OPDS2_MEDIA_TYPE]: marcToOpds,
          [MARC_MEDIA_TYPE]: input => {
            return fromISO2709(input).map(
              o => {
                const isRusmarc = (detectMarcSchemaUri(o) === RUSMARC_JSON_SCHEMA_URI);
                const isUnimarc = (detectMarcSchemaUri(o) === UNIMARC_JSON_SCHEMA_URI);
                return (isRusmarc || isUnimarc)
                  ? RUSMARC_TO_MARC21_JSONATA(forceArray(o).map(marcObjectToJson))
                  : forceArray(o).map(marcObjectToJson);
              },
            );
          },
          [MARCXML_MEDIA_TYPE]: input => fromISO2709(input).map(toSlimXml).join('\n'),
          // [MARC_MEDIA_TYPE]: input => input,
          [JSONLD_MEDIA_TYPE]: marcToOpds,
          [JSON_MEDIA_TYPE]: input => fromISO2709(input),
        },
      };
