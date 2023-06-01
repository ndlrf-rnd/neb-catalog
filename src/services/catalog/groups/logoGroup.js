const { _multiLang } = require('../../../i18n/i18n');
const { _title } = require('../../../i18n/i18n');
const { OPDS2_MEDIA_TYPE } = require('../../../formats/opds2/constants');
const { PNG_MEDIA_TYPE } = require('../../../constants');


const CATALOG_LOGO_GROUP = {
  'metadata': {
    ..._title('NEL SEED Logo'),
    'type': OPDS2_MEDIA_TYPE,
  },
  'publications': [
    {
      'links': [
        {
          'rel': 'self',
          'href': '/index.json#logo',
          'type': OPDS2_MEDIA_TYPE,
        },
        {
          ..._title('Image file'),
          'href': 'https://commons.wikimedia.org/wiki/File:Dolmatov_World_tree.png',
          'rel': 'http://opds-spec.org/acquisition/open-access',
          'type': 'image/png',
        },
      ],
      'metadata': {
        'identifier': 'https://commons.wikimedia.org/wiki/File:Dolmatov_World_tree.png',
        '@id': 'https://commons.wikimedia.org/wiki/File:Dolmatov_World_tree.png',
        '@type': 'https://schema.org/ImageObject',
        'type': OPDS2_MEDIA_TYPE,
        ..._title('NDL Logo: World Tree (Russian ornament. 19th century)'),
        'abstract': _multiLang('World tree. Russian ornament. 19th century.'),
        'contributor': [
          { 'name': _multiLang('Dolmatov K.') },
        ],
        'published': '1889-01-01',
        'responsibilityNotes': 'Image licensed under Creative Commons and provided by the Ru.Wikipedia community.',
      },
      'images': [
        {
          'rel': 'cover',
          'type': PNG_MEDIA_TYPE,
          'width': 81,
          'height': 90,
          'href': '/static/images/world_tree_81x90.png',
        },
      ],
    },
  ],
};
module.exports = { CATALOG_LOGO_GROUP };
