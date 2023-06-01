const fetch = require('node-fetch');
const { error, info } = require('../../utils');
const queryBooks = (bookIds) => {
  const bookIdsQueryString = bookIds.map(
    bid => `book_id[]=${bid}`,
  ).join('&');

  return fetch('https://rusneb.ru/rest_api/book/info/', {
    'headers': {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'en-GB,en;q=0.9,ru;q=0.8,la;q=0.7,zh-CN;q=0.6,zh;q=0.5',
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
    },
    'referrer': 'https://rusneb.ru',
    'referrerPolicy': 'no-referrer-when-downgrade',
    'body': bookIdsQueryString + '&fingerprint=null&state=0&ip=10.0.0.131',
    'method': 'POST',
  }).catch(error).then(
    async resp => {
      const ACCESS_MAPPING = {
        'open': 'Доступно по ссылке:',
        'close': 'Недоступно',
        'local': 'Обратитесь в ближайший электронный читальный зал НЭБ: https://rusneb.ru/workplaces/',
      };

      const { items } = await resp.json();
      Object.keys(items).sort().forEach(
        bookId => {
          const accessStatus = items[bookId].access;
          info(
            bookId,
            ACCESS_MAPPING[accessStatus] || 'Статус непонятен',
            (accessStatus === 'open') ? `https://viewer.rusneb.ru/ru/${bookId}?page=1&rotate=0&theme=white` : '',
          );
        },
      );
    },
  );
};
module.exports = { queryBooks };
