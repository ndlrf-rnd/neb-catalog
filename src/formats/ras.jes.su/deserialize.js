const phpUnserialize = require('./contrib/locutus-php-unserialize');

const deserialize = (rep) => {
  return phpUnserialize(
    rep.startsWith('a:')
      ? rep
      : decodeURIComponent(rep.replace(/(^[ \n\r\t]*$)/ug, '').replace(/[+]/ug, ' ')),
  );
};
module.exports = { deserialize };
