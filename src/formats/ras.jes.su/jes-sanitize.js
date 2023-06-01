const {
  forceArray,
  compact,
  flatten,
  cpMap,
  set,
  get,
} = require('../../utils');

const { fetchIssnL } = require('../../operations/fetchers/issn');
const mediaStorage = require('../../mediaStorage');

// const JES_EMBEDDED_MEDIA_TYPE = 'application/x-php';
const PROVIDER_RAS_JES_SU = 'ras.jes.su';
const RAS_JES_SU_MEDIA_TYPE = 'application/xml:jes';
const CONTENT_JSON_PATH = 'journal[0].publications[0].publication';

const fetchImages = (imagesMetadataRecs, journalUrl) => cpMap(
  forceArray(imagesMetadataRecs),
  async (imageRec) => ({
    ...imageRec,
    ...(await mediaStorage.uploadAsync(
      [
        journalUrl.replace(/\/+$/u, ''),
        'images',
        'publication_images',
        get(imageRec, 'product_id'),
        get(imageRec, 'image_path'),
      ].join('/'),
    )),
  }),
);


const offloadPublicationsContent = async (jsonObj) => {
  const content = forceArray(get(jsonObj, CONTENT_JSON_PATH, []));
  content.forEach(
    (pubEl, idx) => {
      set(
        jsonObj,
        CONTENT_JSON_PATH + `[${idx}].text[0]._text[0]`,
        'SURROGATE_ID',
      );
    },
  );
  return content;
};

const enrichJes = async (inputObject, options = { fetchImages: false }) => {
  const o = { ...(options || {}) };
  const offloadedUnpacked = await offloadPublicationsContent(inputObject,);
  return {
    ...offloadedUnpacked,
    journal: await cpMap(
      forceArray(offloadedUnpacked.journal),
      async (el) => {
        const issn = await cpMap(
          forceArray(el.issn),
          async (issnStr) => flatten((await fetchIssnL(issnStr))['@graph']),
        );
        const journalUrl = compact(issn.map(({ url }) => url))[0] || '';
        const identifier = get(el, 'external_pid') || journalUrl;
        return ({
          '@id': journalUrl,
          // identifier,
          url: journalUrl,
          ...el,
          ...(issn.length > 0 ? { issn } : {}),
          publications: [
            {
              publication: await cpMap(
                get(el, ['publications', 0, 'publication'], []),
                async pubEl => {
                  const images = get(pubEl, ['publication_images', 0, 'image'], []);
                  const identifier = get(pubEl, 'external_pid');
                  const publicationUrl = `${journalUrl.replace(/\/+$/u, '')}/${identifier}`;
                  return {
                    ...pubEl,
                    '@id': publicationUrl,
                    // identifier,
                    url: publicationUrl,
                    text: typeof pubEl.text !== 'undefined'
                      ? await mediaStorage.uploadAsync(pubEl.text)
                      : null,
                    publication_images: [
                      {
                        images: o.fetchImages && (images.length > 0)
                          ? await fetchImages(images, journalUrl)
                          : [],
                      },
                    ],
                  };
                },
              ),
            },
          ],
        });
      },
    ),
  };
};
module.exports = {
  PROVIDER_RAS_JES_SU,
  RAS_JES_SU_MEDIA_TYPE,
  enrichJes,
  offloadPublicationsContent,
};
