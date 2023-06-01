/**
 * Изначально пример предполагается запускать в окружении`ёNode.js`
 * - [Node.js](http://nodejs.org/)
 * - [Бинарные дистрибутивы](https://github.com/nodesource/distributions)
 */
const fs = require('fs');
const crypto = require('crypto');
const fetch = require('node-fetch');

const info = console.info
/**
 * Конфигурация, специфичная для схемы интеграции и конкретного партнера
 * Для тестирования на площадке «ЛитРес» заведен партнер TEST,
 * домен tester.litres.ru.ru, а также секретный ключ ZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZX.
 * Для этого тестового партнера всегда доступна книга
 * 65830123-26b8-4b07-8098-c18229e5026e (Психология Искусства). 
 *
 * Протестировать процесс загрузки списка обновлений,
 * а также разобраться в принципах формирования запросов к API вы можете с помощью
 * тестового файла https://www.litres.ru/static/get_fresh_book_tester.html.
 * Затем вы можете скачать этот файл и изменить под свои задачи тестирования различных запросов. 
 */
const LITRES_PARTNER_ID = 'TEST';
const LITRES_SECRET_KEY = process.env.LITRES_SECRET_KEY || 'NOTAKEYINANYSENSE';
const LITRES_FQDN = 'partnersdnld.litres.ru.ru';
const LITRES_SCHEME = 'https';
const LITRES_PATH_GET_FRESH_BOOK = 'get_fresh_book';
const LITRES_PATH_GET_THE_BOOK = 'get_the_book';

const LITRES_PATH_GET_AUDIO_SAMPLE = 'get_mp3_trial';
const LITRES_PATH_GET_PDF_SAMPLE = 'get_pdf_trial';
const LITRES_PATH_GET_TEXT_SAMPLE = 'pub/t';

const TEST_BOOK_EXTERNAL_ID = '65830123-26b8-4b07-8098-c18229e5026e';

/**
 * Для получения полной базы (при первоначальной загрузке)
 * используйте чекпойнт «2013-01-01 00:00:00»;
 */
const LITRES_EARLIEST_CHECKPOINT = '2013-01-01 00:00:00'
const LITRES_DEFAULT_CHECKPOINT = '2020-01-01 00:00:00'


/**
 @type: Тип запрашиваемого контента, необязательный параметр.
 По-умолчанию подразумевается type=0. Возможные значения:

 | код | описание |
 |-----|-----------|
 | 0   | электронные тексты/книги |
 | 1   | аудиокниги |
 | 4   | PDF-книги |
 | 11  | Книги на английском языке (Adobe DRM protected) |
 | all | все типы произведений. При этом клиент должен ожидать, что ему будут выданы произведения, тип которых ему не известен. |

 */
const LITRES_TYPES = {
  ELECTRONIC: '0',
  AUDIO: '1',
  PDF: '4',
  ENG: '11',
  ALL: 'all',
};


/**
 * Получить текущее значение linux epoch в секундых
 * @returns {number}
 */
const getEpochTsSec = () => Math.floor(
  (new Date()).getTime() / 1000,
);

/**
 * Получить текущее или заданное время в формате ЛитРес
 * @returns {string}
 */
const litResNowStr = (userDateObj) =>
  (userDateObj || (new Date()))
    .toISOString()
    .split('.')[0]
    .replace('T', ' ');


/**
 * Подписать массив значений по схеме litres.ru используя sha256 hash
 * @param arr
 * @returns {string}
 */
const signArray = (arr) => crypto
  .createHash('sha256')
  .update(arr.join(':'), 'ascii')
  .digest('hex');


/**
 * Преобразоваь словарь значений в формат HTTP Query String
 * @param dict
 * @returns {string}
 */
const dictToQueryString = dict => `?${
  Object.keys(dict).sort()
    .reduce((a, k) => ([...a, `${k}=${dict[k]}`]), [])
    .join('&')
}`;


/**
 * Получить фид с обновлениями
 * @param litresType
 * @param checkpoint: время в формате ISO (например, 2017-12-06 19:35:39),
 *                    с которого следует забирать новинки.
 *                    Вы получите список новинок со временем большим или равным checkpoint
 *                    и меньшим /fb-updates/@timestamp (см. описание XML ниже).
 *
 *                    Если вы хотите получать непрерывную ленту новинок,
 *                    сохраняйте отданный вам сервером `/fb-updates/@timestamp` 
 *                    и в следующий раз используйте его в качестве checkpoint.
 *                    Для получения полной базы (при первоначальной загрузке)
 *                    используйте чекпойнт «2013-01-01 00:00:00»;
 *
 * @returns {Promise<any>}
 */
const getLitresNewUrl = (
  litresType = LITRES_TYPES.ALL,
  checkpoint = LITRES_DEFAULT_CHECKPOINT,
) => {
  if (litresType && (Object.values(LITRES_TYPES).indexOf(litresType) === -1)) {
    throw new Error(`Invalid @type param: ${litresType}`);
  }

  const sanitizedCheckpoint = checkpoint || litResNowStr();
  const timestamp = getEpochTsSec();
  /**
   * sha – подпись запроса. Формируется как: sha256_hex
   * (timestamp.':'.secret_key.':'.checkpoint) –
   * обратите внимание на разделяющие параметры двоеточия.
   * Параметры для расчета sha-подписи будут использоваться в том виде,
   * как были переданы в запросе, secret_key – секретный ключ для уведомлений,
   * который передается партнеру при подключении
   * (см. 8. Данные, передаваемые при подключении партнера). Обязательный параметр.
   */
  const sha256Digest = signArray([timestamp, LITRES_SECRET_KEY, checkpoint]);

  const qsParams = dictToQueryString({
    place: LITRES_PARTNER_ID,
    type: litresType,
    sha: sha256Digest,
    timestamp: timestamp,
    checkpoint: sanitizedCheckpoint,
  });
  /**
   * Пример
   * https://partnersdnld.litres.ru/get_fresh_book/?checkpoint=2015-10-08%2000:00:00&place=TEST&timestamp=1444248000&sha=4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5
   */
  return encodeURI(
    [
      `${LITRES_SCHEME}:/`,
      LITRES_FQDN,
      LITRES_PATH_GET_FRESH_BOOK,
      qsParams,
    ].join('/'),
  );
};


/*
  ## Получить файл книги используя "Интерфейс получения файла книги" litres.ru напрямую

  Для получения файла книги используется URL:

  ```
  https://partnersdnld.litres.ru/get_the_book/
  ```

  Данный URL принимает запросы с параметрами, которые будут указаны ниже.
  В ответ отдается ZIP-архив с fb2-файлом (для электронной книги) или файл другого формата (если заполнено поле `file`). 

  Параметры запроса (параметры `book`, `sha`, `place` являются обязательными):

  | Параметр  | Описание | Обязательный? |
  | --------- | -------- | ------------- |
  | book      | fb2-ID книги (извлекается из updated-book/@external_id, подробности см. в 1.2. Формат ответа сервера). Обязательный параметр | true |
  | sha       | подпись запроса. На Perl ключ генерируется следующим образом: lc Digest::SHA::sha256_hex($BookID.':'.$Key); # где $Key – ваш секретный ключ, который предоставляется партнерам при подключении (см. 8. Данные, передаваемые при подключении партнера). Обратите внимание, что в $BookID ожидается ID книги в нижнем регистре. Обязательный параметр | true |
  | place     | ID партнера, обычно это четырехбуквенный код (см. 8. Данные, передаваемые при подключении партнера). Обязательный параметр | true |
  | type      | необязательный атрибут, указывает формат, в котором требуется вернуть файл электронной книги. По умолчанию считается fb2.zip, допустимые значения:
               - fb2.zip
               - rtf.zip
               - a6.pdf
               - a4.pdf
               - html.zip
               - txt.zip
               - rtf.zip
               - doc.prc.zip
               - rb
               - epub
               - mobi.prc
               - txt
               - isilo3.pdb
               - lit
               - ios.epub | false |
  | file      | ID файла из `updated-book/files/group/file/@id`

                Необязательный параметр, используемый для получения PDF и аудио файлов
                `type` в этом случае заполнять не требуется.
                Если параметр не передан, то в выдачу попадут файлы форматаfb2.zip и производные от него. | false |
*/


const getFileLitresUrl = (
  bookExternalId,
  fileId,
  fileType = null,
) => {
  /**
   * ВНИМАНИЕ!
   *
   * Конвертировать значения в строчный регистр требуется только для
   * подписи конкретно этого запроса.
   *
   * Для получения ленты обновлений этого делать не надо.
   */
  const sha256Digest = signArray([
      bookExternalId.toLowerCase(),
      LITRES_SECRET_KEY,
    ],
  );

  const qsParams = dictToQueryString({
    sha: sha256Digest,
    book: bookExternalId,
    place: LITRES_PARTNER_ID,
    ...(fileId ? { file: fileId } : {}),
    ...(fileType ? { type: fileType } : {}),
  });

  return encodeURI(
    [
      `${LITRES_SCHEME}:/`,
      LITRES_FQDN,
      LITRES_PATH_GET_THE_BOOK,
      qsParams,
    ].join('/'),
  );
};

// Пробуем
/*
  На приере метаданных следующей реальной позиции:

  ```
 */

const getLitresSampleUrl = (
  bookId,
  fileExtension = 'fb2.zip',
) => {
  if (fileExtension.match(/mp[34]$/ui)) {
    return encodeURI(
      [
        `${LITRES_SCHEME}:/`,
        LITRES_FQDN,
        LITRES_PATH_GET_AUDIO_SAMPLE,
        `${bookId}.${fileExtension}`,
      ].join('/'),
    );
  }
  if (fileExtension.match(/pdf$/ui)) {
    return encodeURI(
      [
        `${LITRES_SCHEME}:/`,
        LITRES_FQDN,
        LITRES_PATH_GET_PDF_SAMPLE,
        `${bookId}.pdf`,
      ].join('/'),
    );
  }
  return encodeURI(
    [
      `${LITRES_SCHEME}:/`,
      LITRES_FQDN,
      LITRES_PATH_GET_TEXT_SAMPLE,
      `${bookId}.${fileExtension}`,
    ].join('/'),
  );
};


/*
  ## Получить файл книги с сайта партнера litres.ru (тип 0)

  Для скачивания текстовой книги с сервера «ЛитРес» партнер формирует URL согласно следующим правилам:

  - HTTP-запрос с доменом, оговоренным сторонами, и указывающим на сервер «ЛитРес» (см. 8. Данные предоставляемые партнером) (например, http://dnlbook.bobook.ru);

  - После доменного имени следует обязательная часть URL: /get_litres_file/ (например, http://dnlbook.bobook.ru/get_litres_file/);

  - Затем следует текущий UNIX-таймстамп: время в секундах с 00:00:00 UTC 1 января, 1970. Ссылка считается валидной, если таймстамп не отстал от текущего времени более чем на 12 часов. Ссылки с устаревшим таймстампом не обрабатываются. (например, http://dnlbook.bobook.ru/get_litres_file/1223476707/). Для понижения чувствительности URL к рассинхронизации времени между сервером партнера и «ЛитРес», рекомендуем брать таймстамп, просроченный на 60 секунд;
    Примечание: _-Программисты Windows! Проверьте свои таймстампы на http://www.timestampgenerator.com/. Обратите внимание, что вычислять таймстамп из местного времени нельзя! Таймстамп считается по UTC и без сдвига летнего/зимнего времени. В Википедии есть множество подробностей по теории таймстампа, а также есть огромное количество исходников для любого языка, от Perl до PL/SQL_

  - Затем следует ID пользователя

    Пример: `http:// dnlbook.bobook.ru/get_litres_file/1223476707/666/`

  - Затем указывается fb2-ID книги в нижнем регистре. В ID могут встречаться недопустимые для URL символы, в этом случае URL следует «эскейпить». (например, http://dnlbook.bobook.ru/get_litres_file/1223476707/666/fb2-test-id-123);

  - Затем, через точку, указывается расширение, выбираемое в зависимости от запрошенного пользователем типа файла. Допускаются следующие расширения:

    | Расширение | Описание |
    | ---------- | -------- |
    | .fb2.zip | зипованный FB2 |
    | .html.zip | зипованный HTML |
    | .txt.zip | зипованный TXT |
    | .rtf.zip | зипованный RTF |
    | .a4.pdf | PDF, оптимизированный для печати на A4 |
    | .a6.pdf | PDF, оптимизированный для чтения на eBook |
    | .isilo3.pdb | формат для iSilo, мультиплатформенной старенькой читалки |
    | .doc.prc.zip | файл palm doc. Формат читает множество старых и не очень программ |
    | .lit | формат файлов читалки Microsoft Reader |
    | .rb | формат для устройства Rocket eBook и REB1100 |
    | .epub | ePub, новый перспективный формат электронных книг, разработанный Adobe |
    | .mobi.prc | файлы для моби-ридера. В данный момент особенно примечательны тем, что работают на Amazon Kindle, хотя для моби есть очень хорошие читалки для PalmOS, Windows Mobile и настольных компьютеров. |

    Пример: `http://dnlbook.bobook.ru/get_litres_file/1223476707/666/fb2-test-id-123.fb2.zip`

  - В качестве GET или POST параметра к этой ссылке добавляется SHA-подпись.

    На Perl ключ генерируется следующим образом:

    ```
    Digest::SHA::sha256_hex($TimeStamp.':'.$UserID.':'.$FB2_id.':'.$Key);
    ```
    где `$Key` – ваш секретный ключ для скачивания, предоставляется партнерам при подключении;
    Пример: `http://dnlbook.bobook.ru/get_litres_file/1223476707/666/fb2-test-id-123.fb2.zip?sha=4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce`

    Обратите внимание, что в $FB2_id ожидается ID книги в нижнем регистре.

    Если у вас проблемы с формированием корректного SHA, вы можете воспользоваться следующей командой для консоли Unix:
*/

/**
 * Эти параметры используются при дистрибьюции через собственный домен партнера.
 */
const LITRES_PARTNER_FQDN = 'litres.ru.rusneb.ru'; /* Пока не заведен */
const LITRES_PARTNER_SCHEME = 'https';
const LITRES_PATH_GET_LITRES_FILE = 'get_litres_file';

const getPartnerFileUrl = (
  bookExternalId,
  fileName,
  fileExtension = 'epub',
  partnerFqdn = LITRES_PARTNER_FQDN,
  partnerScheme = LITRES_PARTNER_SCHEME,
) => {

  const timestamp = getEpochTsSec();

  /**
   * ВНИМАНИЕ!
   *
   * Конвертировать значения в строчный регистр требуется только для
   * подписи конкретно этого запроса.
   *
   * Для получения ленты обновлений этого делать не надо.
   */
  const sha256Digest = signArray(
    [timestamp, LITRES_PARTNER_ID, bookExternalId, LITRES_SECRET_KEY].map(
      v => v.toLowerCase(),
    ),
  );

  const qsParams = dictToQueryString({
    sha: sha256Digest,
  });


  return encodeURI(
    [
      `${partnerScheme || LITRES_SCHEME}:/`,
      partnerFqdn,
      LITRES_PATH_GET_LITRES_FILE,
      timestamp,
      LITRES_PARTNER_ID,
      `${bookExternalId}.${fileExtension}${qsParams}`,
    ].join('/'),
  );
};


const trial = async () => {

  /**
   * Пробуем получить ленту всех аудиокниг
   */
  const litresFeedUrl = getLitresNewUrl(LITRES_TYPES.ELECTRONIC, LITRES_EARLIEST_CHECKPOINT);
  info(`New files URL: ${litresFeedUrl}`);

  const feedFetchResponse = await fetch(litresFeedUrl);
  info('Получили ответ, начинаем писать на диск')
  const feedOutputStream = fs.createWriteStream('./litres.ru-0-2003-01-01_2020-07-03.xml');
  await (new Promise((resolve, reject) => {
    feedOutputStream.on('error', reject);
    feedOutputStream.on('end', resolve);
    feedFetchResponse.body.pipe(feedOutputStream);
  }));
  info('Готово!')

  const testAudioFileUrl = getLitresSampleUrl('173327', 'mp3');
  info(`Test file URL: ${testAudioFileUrl}`);
  const testOutputStream = fs.createWriteStream('/tmp/litres.ru-test-173327.mp3');
  const testFetchResponse = await fetch(testAudioFileUrl);
  await (new Promise((resolve, reject) => {
    bookOutputStream.on('error', reject);
    bookOutputStream.on('end', resolve);
    testFetchResponse.body.pipe(testOutputStream);
  }));

  const bookAudioFileUrl = getFileLitresUrl(TEST_BOOK_EXTERNAL_ID, '3926885');
  info(`Book file URL: ${bookAudioFileUrl}`);
  const fetchResponse = await fetch(bookAudioFileUrl);
  const bookOutputStream = fs.createWriteStream('/tmp/litres.ru-book.blob');
  await (new Promise((resolve, reject) => {
    bookOutputStream.on('error', reject);
    bookOutputStream.on('end', resolve);
    fetchResponse.body.pipe(bookOutputStream);
  }));
  log('Все прошло упешно');
};
/**
 * Функция `getPartnerFileUrl(...)` и связанная с ней схема интеграции
 * ПОКА НЕ ИСПОЛЬЗУЕТСЯ НЭБ, соответственно нет возможности проверить вызов
 */

trial().catch(error).then(info);


