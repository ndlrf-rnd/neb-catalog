const { KNPAM_USED_TABLES } = require('./constants');
const { KNPAM_MANDATORY_RECORD_FIELDS } = require('./constants');
const {
  sanitizeDataObject,
  warn,
  info,
  debug,
  isValidDate,
  pick,
  jsonStringifySafe,
  forceArray,
  flattenDeep,
  jsonParseSafe,
} = require('../../utils');
const { OPDS2_MEDIA_TYPE } = require('../opds2/constants');
const {
  KNPAM_MANDATORY_DUMP_FIELDS,
  KNPAM_RUSNEB_RU_ENCODING,
  KNPAM_RUSNEB_RU_TO_ENTITIES_JSONATA,
  KNPAM_RUSNEB_RU_EXTENSION,
  KNPAM_RUSNEB_RU_MEDIA_TYPE,
} = require('./constants');


const isDump = (obj) => KNPAM_MANDATORY_DUMP_FIELDS.reduce(
  (a, k) => (a && (typeof obj[k] !== 'undefined')),
  true,
);

const isSingleObject = obj => KNPAM_MANDATORY_RECORD_FIELDS.reduce(
  (a, k) => (a && (typeof obj[k] !== 'undefined')),
  true,
);

const splitDump = (dumpJson) => {
  const groups = forceArray(dumpJson.directories).reduce(
    (a, o, idx) => {
      if ((idx % 1000 === 999) || (idx + 1 === dumpJson.directories.length)) {
        debug(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] Separating JSON dump with fields - Groups ${idx + 1}/${dumpJson.directories.length}`);
      }
      return ({
        ...a,
        [o.id]: o,
      });
    },
    {},
  );
  const items = dumpJson.copies.filter(
    ({ deleted }) => !deleted,
  ).reduce(
    (a, o, idx) => {
      if ((idx % 1000 === 999) || (idx + 1 === dumpJson.copies.length)) {
        debug(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] Separating JSON dump with fields - Items ${idx + 1}/${dumpJson.copies.length}`);
      }
      return ({
        ...a,
        [o.id]: o,
      });
    },
    {},
  );

  const partInstances = dumpJson.parts.reduce(
    (a, o, idx) => {
      if ((idx % 1000 === 999) || (idx + 1 === dumpJson.parts.length)) {
        debug(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] Separating JSON dump with fields - Parts ${idx + 1}/${dumpJson.parts.length}`);
      }
      return ({
        ...a,
        [o.id]: o,
      });
    },
    {},
  );

  const instances = dumpJson.items.filter(
    ({ deleted }) => !deleted,
  ).reduce(
    (a, o, idx) => {
      if ((idx % 1000 === 999) || (idx + 1 === dumpJson.parts.length)) {
        debug(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] Separating JSON dump with fields - Instances ${idx + 1}/${dumpJson.parts.length}`);
      }
      return {
        ...a,
        [o.id]: o,
      };
    },
    {},
  );


  const userIdToUser = dumpJson.users.reduce(
    (a, o, idx) => {
      if ((idx % 1000 === 999) || (idx + 1 === dumpJson.users.length)) {
        debug(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] Separating JSON dump with fields - Users ${idx + 1}/${dumpJson.users.length}`);
      }
      return {
        ...a,
        [o.id]: o,
      };
    },
    {},
  );

  const partInstanceIdToInstance = dumpJson.parts.reduce(
    (a, o, idx) => {
      if ((idx % 1000 === 999) || (idx + 1 === dumpJson.parts.length)) {
        debug(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] Separating JSON dump with fields - Parts <-> Instances ${idx + 1}/${dumpJson.parts.length}`);
      }
      return {
        ...a,
        [o.id]: instances[o.item_id],
      };
    },
    {},
  );

  return Object.values(items).sort(
    (a, b) => parseInt(`${a.num}`, 10) - parseInt(`${b.num}`, 10),
  ).map((item, idx) => {
      if ((idx % 1000 === 999) || (idx + 1 === items.length)) {
        debug(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] Making output record for item ${idx + 1}/${Object.keys(items).length}`);
      }
      const part = partInstances[item.part_id];
      if (!part) {
        warn(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] WARNING: Part with ID ${item.part_id} not found`);
        return null;
      }
      const instance = partInstanceIdToInstance[part.id];
      if (!instance) {
        warn(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] WARNING: Instance not found for part ID ${part.id}`);
        return null;
      }
      const organization = userIdToUser[item.user_id];
      if (!organization) {
        warn(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] WARNING: Organization with id ${item.user_id} not found`);
        return null;
      }

      const division = userIdToUser[item.user_id];
      if (!organization) {
        warn(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] WARNING: Organization with id ${item.user_id} not found`);
        return null;
      }
      const group = instance.doc_type ? groups[instance.doc_type] : null;
      if (!organization) {
        warn(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] WARNING: Group with id ${item.doc_type} not found`);
        return null;
      }
      return {
        item,
        part,
        instance,
        organization,
        division,
        group,
      };
    },
  ).filter(v => !!v);
};
const isOrganization = (rec) => (typeof rec.organization === 'object') && (rec.organization.id);
const isGroup = (rec) => (typeof rec.group === 'object') && (rec.group.id);
/**
 *
 * @param record {Buffer|string}
 * @returns {any}
 */
const parseInput = (record) => {
  const dataStr = (typeof record !== 'string') && Buffer.isBuffer(record)
    ? record.toString(KNPAM_RUSNEB_RU_ENCODING)
    : record;
  const inputRecords = forceArray(jsonParseSafe(dataStr));
  return inputRecords.reduce(
    (acc, rec) => {
      if (isDump(rec)) {
        const sanitizedRecordObjects = pick(rec, KNPAM_USED_TABLES);
        return [...acc, ...splitDump(sanitizedRecordObjects)];
      } else if (isSingleObject(rec)) {
        return [...acc, rec];
      } else if (isOrganization(rec)) {
        return [...acc, rec];
      } else if (isGroup(rec)) {
        return [...acc, rec];
      } else {
        warn(JSON.stringify(record));
        throw new Error(
          `Input neither JSON dump of knpam DB nor the raw aggregated record from this dump`,
        );
      }
    },
    [],
  );

};

module.exports = {
  extension: KNPAM_RUSNEB_RU_EXTENSION,
  mediaType: KNPAM_RUSNEB_RU_MEDIA_TYPE,
  toEntities: async (input) => {
    const records = parseInput(input);
    return records.reduce(
      (acc, rec, idx) => {
        if (idx % 1000 === 999) {
          debug(`[IMPORT:KNPAM.RUSNEB.RU:${process.pid}] Processing record ${idx + 1}/${records.length}`);
        }
        const timeSource = [
          isValidDate(new Date(rec.item.updated_at)) ? new Date(rec.item.updated_at) : null,
          isValidDate(new Date(rec.instance.updated_at)) ? new Date(rec.instance.updated_at) : null,
        ].sort((a, b) =>
          (a ? a.getTime() : 0) - (b ? b.getTime() : 0),
        )[0];
        const organizationTimeSource = isValidDate(new Date(rec.organization.updated_at))
          ? new Date(rec.organization.updated_at)
          : null;
        return [
          ...acc,
          {
            'kind': 'item',
            'source': 'knpam.rusneb.ru',
            'key': `${rec.item.num}`,
            'time_source': timeSource,
            'record': jsonStringifySafe(rec),
            'media_type': KNPAM_RUSNEB_RU_MEDIA_TYPE,
          },
          ...(rec.organization ? [
            {
              'kind_to': 'item',
              'source_to': 'knpam.rusneb.ru',
              'key_to': `${rec.item.num}`,

              'kind_from': 'organization',
              'source_from': 'knpam.rusneb.ru',
              'key_from': `${rec.organization.id}`,

              'relation_kind': 'hasItem',
              'time_source': organizationTimeSource,
            },
            {
              'kind': 'organization',
              'source': 'knpam.rusneb.ru',
              'key': `${rec.organization.id}`,
              'time_source': organizationTimeSource,
              'record': jsonStringifySafe(pick(rec, ['organization'])),
              'media_type': KNPAM_RUSNEB_RU_MEDIA_TYPE,
            }] : []),
          ...(rec.group ? [{
            'kind_to': 'item',
            'source_to': 'knpam.rusneb.ru',
            'key_to': `${rec.item.num}`,

            'kind_from': 'group',
            'source_from': 'knpam.rusneb.ru',
            'key_from': `${rec.group.id}`,

            'relation_kind': 'hasItem',
          },
            {
              'kind': 'group',
              'source': 'knpam.rusneb.ru',
              'key': `${rec.group.id}`,
              'record': jsonStringifySafe(rec.group),
              'media_type': KNPAM_RUSNEB_RU_MEDIA_TYPE,
            },
          ] : []),
        ];
      },
      [],
    );
  },
  to: {
    [OPDS2_MEDIA_TYPE]: (input) => flattenDeep(
      parseInput(input).map(
        itemRec => KNPAM_RUSNEB_RU_TO_ENTITIES_JSONATA(
          sanitizeDataObject(itemRec),
        ),
      ),
    ),
  },
};


/**
 Instances (NOT ITEMS, its semantically wrong filed name in source)

 Currently instances creation is DISABLED to avoid multiplying exactly
 the same heritage registry card information between two entities.

 The point is that registry card with registry identifier is always
 related to material item. Analytical level is not such crucial part.
 Disabled Jsonata code creating instances:

 ```
 {
      'kind': 'instance',
      'source': 'knpam.rusneb.ru',
      'key': $string($.part.id),
      'media_type': 'application/opds+json',
      'time_source': $.updated_at,
      'record': {
        'metadata': $merge([
          $getInstance($.instance),
          $getPart($.part)
        ]),
        'images': $getImages($.item),
        'links': []
      }
    },

 {
      'kind_from': 'instance',
      'source_from': 'knpam.rusneb.ru',
      'key_from': $.part.id,

      'kind_to': 'item',
      'source_to': 'knpam.rusneb.ru',
      'key_to': $string($.item.num),

      'time_source': $.item.updated_at,
      'relation_kind': 'hasItem'
    }
 ```
 */
