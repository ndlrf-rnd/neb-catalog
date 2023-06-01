const DC_MKRF_MEDIA_TYPE = 'application/atom+xml';
const DC_MKRF_ENCODING = 'utf-8';
const JS_TO_XML_OPTIONS = {
  compact: true,
    alwaysArray: true,
  spaces: 2,
}
module.exports = {
  DC_MKRF_MEDIA_TYPE,
  DC_MKRF_ENCODING,
  JS_TO_XML_OPTIONS,
  port: 3003,
  feedLang: 'ru',
  feed: {
    uri: '/epub_content/epub_library.opds',
    id: 'NEB_EPUB_SDK_DEV_LOCAL_OPDS',
    title: 'NEB EPUB SDK local dev OPDS feed',
    lang: 'ru',
  },
  defaultCoverImage: '/images/default_cover_01.png',
  xmlRenderOptions: {
    indent: '  ',
  },
  output: 'application/xml',
};