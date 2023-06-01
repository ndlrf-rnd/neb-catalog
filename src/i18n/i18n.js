const i18n = require('i18n');
const { I18N_CONFIG } = require('./i18n.config');

i18n.configure(I18N_CONFIG);

const _multiLang = (phrase, ctx) => I18N_CONFIG.locales.reduce(
  (a, locale) => ({
    ...a,
    [locale]: i18n.__({
      phrase,
      locale,
    }, ctx),
  }),
  {},
);

/**
 * Return object with all translations
 * @returns {string|*}
 * @private
 * @param phrase
 * @param ctx
 */
const ___ = (phrase, ctx) => i18n.__({
  phrase,
  locale: I18N_CONFIG.locales[0],
}, ctx);

const _title = (phrase, ctx) => ({
  title: ___(phrase, ctx),
  name: _multiLang(phrase, ctx),
});

module.exports = {
  i18n: i18n,
  __: i18n.__,
  ___,
  _multiLang,
  _title,
};
