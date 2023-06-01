const Typograf = require('typograf');
const { TYPOGRAF_OPTIONS } = require('../../constants');
const typHtml = (htmlTxt, typografOptions=TYPOGRAF_OPTIONS) => {
  const typograf = new Typograf(typografOptions.global);
  typografOptions.rules.forEach((rule) => {
    typograf.setSetting(...rule);
  });
  return typograf
    .execute(htmlTxt)
    .replace(/<(br|nobr|img|video|audio)([^>]*[^/>]|)>/ug, '<$1 $2 />');
};

module.exports = {
  typHtml,
};
