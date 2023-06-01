const path = require('path')
const I18N_DEFAULT_LOCALE = 'ru';
const I18N_CONFIG = {
  updateFiles: false,
  staticCatalog: {
    ru: require(path.join(__dirname, 'ru.json')),
    en: require(path.join(__dirname, 'en.json')),
  },
  locales: ['en', 'ru'],
  register: global,
  defaultLocale: 'ru',
};
module.exports = {
  I18N_CONFIG,
  I18N_DEFAULT_LOCALE,
};
