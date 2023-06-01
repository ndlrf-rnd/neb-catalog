const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Ajv = require('ajv');
const { omit } = require('../../../utils');

const {
  isObject,
  flattenDeep,
  jsonParseSafe,
  forceArray, replaceUriParam, cpMap,
} = require('../../../utils');
const { OPDS2_FEED_SCHEMA_PATH } = require('../../../formats/opds2/constants');
const { OPDS2_CONFIG } = require('../../../constants');
const normalizeModified = (page) => {
  const fixPub = (pub) => ({
      ...pub,
      ...(pub.modified ? { modified: '2020-02-02T02:02:02.200Z' } : {}),
      ...(pub.sourceModified ? { sourceModified: '2020-02-02T02:02:02.200Z' } : {}),
      ...(pub.created_at ? { created_at: '2020-02-02T02:02:02.200Z' } : {}),
      ...(pub.createdAt ? { createdAt: '2020-02-02T02:02:02.200Z' } : {}),

      ...(pub.publications ? { publications: (pub.publications || []).map(fixPub) } : {}),
      ...(pub.groups ? { groups: (pub.groups || []).map(fixPub) } : {}),
      ...(pub.properties ? {
        properties: {
          ...pub.properties,
          ...(pub.properties.modified ? { modified: '2020-02-02T02:02:02.200Z' } : {}),
          ...(pub.properties.sourceModified ? { sourceModified: '2020-02-02T02:02:02.200Z' } : {}),

        },
      } : {}),
      ...(pub.navigation ? { navigation: forceArray(pub.navigation).map(fixPub) } : {}),
      ...(pub.links ? { links: forceArray(pub.links).map(fixPub) } : {}),
      ...(pub.metadata ? {
        metadata: {
          ...pub.metadata,
          ...(pub.metadata.modified ? { modified: '2020-02-02T02:02:02.200Z' } : {}),
          ...(pub.metadata.sourceModified ? { sourceModified: '2020-02-02T02:02:02.200Z' } : {}),
          ...(pub.metadata.processingTimeSec ? { processingTimeSec: 0.01 } : {}),
          ...(pub.metadata.belongsTo && pub.metadata.belongsTo.collection ? {
            belongsTo: {
              collection: forceArray(pub.metadata.belongsTo.collection).map(
                c => ({
                  ...c,
                  ...(c.modified ? { modified: '2020-02-02T02:02:02.200Z' } : {}),
                  ...(c.sourceModified ? { sourceModified: '2020-02-02T02:02:02.200Z' } : {}),
                  ...(c.properties ? {
                    properties: {
                      ...c.properties,
                      ...(c.properties.modified ? { modified: '2020-02-02T02:02:02.200Z' } : {}),
                      ...(c.properties.sourceModified ? { sourceModified: '2020-02-02T02:02:02.200Z' } : {}),

                    },
                  } : {}),
                }),
              ),
            },
          } : {}),
        },
      } : {}),
    }
  );
  return fixPub(page);
};
const ajv = new Ajv();
const ajvInstance = ajv.addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, './datastack-api-test/tests/api-schema.json'),
      'utf-8',
    ),
  ),
  'data-stack/api-schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/link.schema.json'),
      'utf-8',
    ),
  ),
  'https://readium.org/webpub-manifest/schema/link.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/metadata.schema.json'),
      'utf-8',
    ),
  ),
  'https://readium.org/webpub-manifest/schema/metadata.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/subject-object.schema.json'),
      'utf-8',
    ),
  ),
  'subject-object.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/subject.schema.json'),
      'utf-8',
    ),
  ),
  'subject.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/contributor-object.schema.json'),
      'utf-8',
    ),
  ),
  'contributor-object.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/contributor.schema.json'),
      'utf-8',
    ),
  ),
  'contributor.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/drafts.opds.io/schema/feed-metadata.schema.json'),
      'utf-8',
    ),
  ),
  'feed-metadata.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/drafts.opds.io/schema/publication.schema.json'),
      'utf-8',
    ),
  ),
  'https://drafts.opds.io/schema/publication.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/drafts.opds.io/schema/feed.schema.json'),
      'utf-8',
    ),
  ),
  'https://drafts.opds.io/schema/feed.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/extensions/presentation/metadata.schema.json'),
      'utf-8',
    ),
  ),
  'extensions/presentation/metadata.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/extensions/presentation/properties.schema.json'),
      'utf-8',
    ),
  ),
  'extensions/presentation/properties.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/extensions/epub/properties.schema.json'),
      'utf-8',
    ),
  ),
  'extensions/epub/properties.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/extensions/epub/metadata.schema.json'),
      'utf-8',
    ),
  ),
  'extensions/epub/metadata.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/drafts.opds.io/schema/acquisition-object.schema.json'),
      'utf-8',
    ),
  ),
  'https://drafts.opds.io/schema/acquisition-object.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/drafts.opds.io/schema/properties.schema.json'),
      'utf-8',
    ),
  ),
  'https://drafts.opds.io/schema/properties.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/link.schema.json'),
      'utf-8',
    ),
  ),
  'link.schema.json',
).addSchema(
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../../schemas/readium.org/webpub-manifest/schema/subcollection.schema.json'),
      'utf-8',
    ),
  ),
  'https://readium.org/webpub-manifest/schema/subcollection.schema.json#',
).addSchema(
  JSON.parse(fs.readFileSync(OPDS2_FEED_SCHEMA_PATH, 'utf-8')),
  'root',
);

const validate = async (data, useDataStackSchema = true) => {
  const errors = [];
  if (useDataStackSchema) {
    await cpMap(
      forceArray(data.publications),
      async data => {
        await ajvInstance.validate('data-stack/api-schema.json', data);
        forceArray(ajvInstance.errors).forEach(err => errors.push({
          err,
          data,
          schema: 'data-stack',
        }));
      },
    );
  }
  await ajvInstance.validate('root', data);
  forceArray(ajvInstance.errors).forEach(err => errors.push({
    err,
    data,
    schema: 'opds2',
  }));
  return errors.length === 0 ? null : errors;
};

describe('api', () => {

  test(
    'fetchResourcesOfKind - limit=7',
    async () => {
      expect.assertions(10);
      const res = await fetch(`${OPDS2_CONFIG.baseUri}/resources?extended=1`);
      const resJson = await res.json();
      resJson.metadata.processingTimeSec = 0.01;
      expect(resJson).toEqual(
        JSON.parse(fs.readFileSync(path.join(__dirname, 'opds2.resources.json'), 'utf-8')),
      );

      // Collections Page 1
      const collection = resJson.navigation.filter(({ href }) => href.match(/collection/uig))[0];
      expect(collection.properties.numberOfItems).toEqual(18);
      const colRes = await fetch(
        replaceUriParam(
          replaceUriParam(collection.href, 'limit', 7),
          'extended',
          '1',
        ),
      );
      const colJson = await colRes.json();
      expect(
        normalizeModified(colJson),
      ).toEqual(
        JSON.parse(fs.readFileSync(path.join(__dirname, 'opds2.collections-limit-7-desc-p1.json')
          , 'utf-8')),
      );
      expect(
        colJson.navigation.filter(({ rel }) => rel !== 'self').map(({ serial }) => serial).filter(v => !!v),
      ).toEqual(
        [
          'collection-18',
          'collection-17',
          'collection-16',
          'collection-15',
          'collection-14',
          'collection-13',
          'collection-12',
        ],
      );

      // Collections Page 2
      const colPageLink2 = colJson.navigation.filter(({ rel }) => rel === 'next')[0];
      expect(colPageLink2.href).toMatch('after=collection-12');

      const col2Res = await fetch(replaceUriParam(colPageLink2.href));
      const col2Json = normalizeModified(await col2Res.json());
      expect(
        col2Json.navigation.filter(({ rel }) => rel !== 'self').map(({ serial }) => serial).filter(v => !!v),
      ).toEqual(
        [
          'collection-11',
          'collection-10',
          'collection-9',
          'collection-8',
          'collection-7',
          'collection-6',
          'collection-5',
        ],
      );
      expect(
        col2Json,
      ).toEqual(
        JSON.parse(fs.readFileSync(path.join(__dirname, 'opds2.collections-limit-7-desc-p2.json'), 'utf-8')),
      );

      // Collections Page 3
      const colPageLink3 = col2Json.navigation.filter(({ rel }) => rel === 'next')[0];
      expect(colPageLink3).toBeTruthy();

      const col3Res = await fetch(replaceUriParam(colPageLink3.href));
      const col3Json = normalizeModified(await col3Res.json());
      // col3Json.metadata.processingTimeSec = 0.01;
      // col3Json.metadata.modified = '2020-02-02T02:02:02.200Z';
      expect(
        col3Json.navigation.filter(({ rel }) => rel !== 'self').map(({ serial }) => serial).filter(v => !!v),
      ).toEqual(
        [
          'collection-4',
          'collection-3',
          'collection-2',
          'collection-1',
        ],
      );
      expect(
        col3Json,
      ).toEqual(
        JSON.parse(fs.readFileSync(path.join(__dirname, 'opds2.collections-limit-7-desc-p3.json'), 'utf-8')),
      );
    },
    30 * 1000,
  );


  test(
    'getResourcesOfSameKind - 10 - DSC',
    async () => {
      expect.assertions(8);
      const res = await fetch(`${OPDS2_CONFIG.baseUri}/resources?extended=1`);
      const resJson = await res.json();
      expect(
        normalizeModified(resJson),
      ).toEqual(
        JSON.parse(fs.readFileSync(path.join(__dirname, 'opds2.resources.json'), 'utf-8')),
      );

      // Items Page 1
      const itemsLink = resJson.navigation.filter(({ title }) => title === 'Items')[0];
      expect(itemsLink.properties.numberOfItems).toEqual(126);
      const page1 = normalizeModified(
        await (await fetch(`${itemsLink.href.split('?')[0]}?extended=1&limit=10`)).json(),
      );

      expect(page1.publications.map(({ metadata: { serial } }) => serial)).toEqual([
        'item-136',
        'item-135',
        'item-134',
        'item-133',
        'item-132',
        'item-131',
        'item-130',
        'item-129',
        'item-128',
        'item-127',
      ]);


      expect(await validate(page1)).toEqual(null);

      // Collections Page 2
      const page2Link = page1.navigation.filter(({ rel }) => rel === 'next')[0];
      expect(page2Link.href).toMatch('after=item-127');

      const page2 = normalizeModified(
        await (await fetch(replaceUriParam(page2Link.href))).json(),
      );
      expect(page2.publications.map(({ metadata: { serial } }) => serial)).toEqual([
        'item-126',
        'item-125',
        'item-124',
        'item-123',
        'item-122',
        'item-121',
        'item-120',
        'item-119',
        'item-118',
        'item-117',
      ]);

      expect(
        normalizeModified(page2),
      ).toEqual(JSON.parse(fs.readFileSync(path.join(__dirname, 'opds2.items-p2.json'), 'utf-8')));

      expect(await validate(page1)).toEqual(null);
    },
    30 * 1000,
  );

  test(
    'resource - collection/kpincunabula/items - limit=7',
    async () => {
      expect.assertions(8);
      const res = await fetch(`${OPDS2_CONFIG.baseUri}/resources.json?extended=1&limit=10`);
      const resJson = await res.json();

      // Collections
      const itemsLink = resJson.navigation.filter(({ title }) => title === 'Collections')[0];
      const resObj = await fetch(itemsLink.href);
      const collectionsPage = await resObj.json();
      const colLink = collectionsPage.navigation.filter(({ rel, href }) => href.match(/\/kpincunabula/uig))[0];
      expect(colLink.href).toEqual('http://localhost:18080/resources/collection/knpam.rusneb.ru/kpincunabula');
      // Items
      const q1 = replaceUriParam(replaceUriParam(colLink.href, 'limit', 7), 'extended', 1);
      const page1 = normalizeModified(await (await fetch(`${q1}`)).json());
      expect(
        page1,
      ).toEqual(JSON.parse(fs.readFileSync(path.join(__dirname, 'opds2.kpincunabula-limit-7-desc-p1.json'), 'utf-8')));

      expect(await validate(page1)).toEqual(null);
      expect(page1.publications.map(({ metadata: { serial } }) => serial)).toEqual([
        'item-81',
        'item-67',
        'item-66',
        'item-51',
        'item-43',
        'item-36',
        'item-23',
      ]);

      // Incunambula Page 2
      const colPageLink2 = page1.navigation.filter(({ rel }) => rel === 'next')[0];
      expect(colPageLink2.href).toContain('after=collection-item-23');

      const page2Res = await fetch(colPageLink2.href);
      const page2 = await page2Res.json();
      expect(
        normalizeModified(page2),
      ).toEqual(
        JSON.parse(fs.readFileSync(path.join(__dirname, 'opds2.kpincunabula-limit-7-desc-p2.json'), 'utf-8')),
      );
      expect(page2.publications.map(({ metadata: { serial } }) => serial)).toEqual([
        'item-20',
        'item-9',
        'item-1',
      ]);
      expect(page2.navigation.filter(({ rel }) => rel === 'next').length).toEqual(0);
    },
    30 * 1000,
  );

  test('raw record links', async () => {
    expect.assertions(7);
    const pageRes = await fetch(`http://localhost:18080/resources/collection/knpam.rusneb.ru/kpcivil?limit=1000&extended=1`);
    const page = await pageRes.json();
    expect(
      normalizeModified(page),
    ).toEqual(
      jsonParseSafe(fs.readFileSync(path.join(__dirname, 'opds.collection-kpcivil.json'), 'utf-8')),
    );
    expect(
      (page.publications || []).map(({ metadata: { identifier } }) => identifier).filter(v => !!v),
    ).toEqual(
      [
        'http://localhost:18080/resources/item/knpam.rusneb.ru/7',
        'http://localhost:18080/resources/item/knpam.rusneb.ru/10',
        'http://localhost:18080/resources/item/knpam.rusneb.ru/6',
        'http://localhost:18080/resources/item/knpam.rusneb.ru/8',
        'http://localhost:18080/resources/item/knpam.rusneb.ru/4',
        'http://localhost:18080/resources/item/knpam.rusneb.ru/3',
        'http://localhost:18080/resources/item/knpam.rusneb.ru/5',
        'http://localhost:18080/resources/item/knpam.rusneb.ru/2',
        'http://localhost:18080/resources/item/knpam.rusneb.ru/1',
        'http://localhost:18080/resources/item/knpam.rusneb.ru/9',
      ],
    );
    const publications = page.publications.filter(({ metadata: { identifier } }) => identifier.match(/\/resources\/item\/knpam\.rusneb\.ru\/[456]$/uig));

    expect(publications.filter(({ error }) => !!error).length).toEqual(0);
    const links = flattenDeep(publications.map(
      (publication) => publication.links.filter(({ rel }) => rel === 'convertedFrom')[0].href,
    ));
    expect(links).toEqual([
      'http://localhost:18080/resources/item/knpam.rusneb.ru/6?export=raw',
      'http://localhost:18080/resources/item/knpam.rusneb.ru/4?export=raw',
      'http://localhost:18080/resources/item/knpam.rusneb.ru/5?export=raw',
    ]);
    const res = await fetch(links[0]);
    expect(res.headers.get('content-type')).toMatch(/application\/[^;]*json(; charset=utf-8)?/ui);
    expect(res.headers.get('content-disposition')).toMatch(/attachment; filename="seed__item__.+\.json"/uig);
    expect(
      (await res.text()).trim(),
    ).toEqual(
      fs.readFileSync(path.join(__dirname, 'knpam.raw.json'), 'utf-8').trim(),
    );
  }, 5 * 1000);

  test('raw record link', async () => {
    expect.assertions(1);
    const pageRes = await fetch(`http://localhost:18080/resources/item/knpam.rusneb.ru/8369`);
    const page = await pageRes.json();
    expect(
      normalizeModified(page).links,
    ).toEqual(
      jsonParseSafe(fs.readFileSync(path.join(__dirname, 'raw-links.json'), 'utf-8')),
    );
  }, 5 * 1000);

  test('item with link using S3 resolver', async () => {
    expect.assertions(1);
    const pageRes = await fetch(`http://localhost:18080/resources/item/knpam.rusneb.ru/8369?extended=1`);
    const page = normalizeModified(await pageRes.json());
    expect(
      page,
    ).toEqual(
      jsonParseSafe(
        fs.readFileSync(
          path.join(__dirname, 'item-with-s3-resolver-link.json'),
          'utf-8',
        ).trim(),
      ),
    );
  }, 5 * 1000);

  test('home link', async () => {
    expect.assertions(2);
    const pageRes = await fetch(`http://localhost:18080/index.json`);
    const page = normalizeModified(await pageRes.json());
    expect(
      page,
    ).toEqual(
      jsonParseSafe(fs.readFileSync(path.join(__dirname, 'home.opds2.json'), 'utf-8').trim()),
    );
    expect(await validate(page)).toEqual(null);
  }, 5 * 1000);

  test('api schema', async () => {
    expect.assertions(1);
    const schemaJson = await (await fetch(`http://localhost:18080/schemas/hyper-schema.json`)).json();
    expect(
      isObject(schemaJson),
    ).toBeTruthy();
  }, 5 * 1000);

  test('frontend HTML', async () => {
    expect.assertions(1);
    const bodyText = await (await fetch(`http://localhost:18080`)).text();
    expect(
      bodyText,
    ).toContain('import \'./static/app/endpoints.js\'');
  }, 5 * 1000);

  test('Schedule operation', async () => {
    expect.assertions(2);
    const scheduleResObj = await (await fetch(
        `http://localhost:18080/operations`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            'account': 'catalog@rusneb.ru',
            'secret': '13ac570f4cedb9b8ce7711a2c763b04e',
            'type': 'import',
            'parameters': {
              'url': 'https://test.com/test.tsv',
              'provider': 'rusneb.ru',
              'mediaType': 'text/tab-separated-values',
            },
          }),
        },
      )
    ).json();
    const scheduledId = scheduleResObj.id;
    expect(
      normalizeModified(scheduleResObj),
    ).toEqual(
      {
        ...JSON.parse(fs.readFileSync(path.join(__dirname, 'operations-schedule.json'), 'utf-8')),
        id: scheduledId,
      },
    );

    const resObj = await (await fetch(
      `http://localhost:18080/operations?account=catalog%40rusneb.ru&secret=13ac570f4cedb9b8ce7711a2c763b04e`,
    )).json();
    expect(
      resObj.links.filter(({ id }) => id === scheduledId).map(normalizeModified),
    ).toEqual(
      JSON.parse(fs.readFileSync(path.join(__dirname, 'operations.json'), 'utf-8')).map(op => ({
        ...op,
        id: scheduledId,
      })),
    );
  }, 5 * 1000);
}, 2 * 60 * 1000);
