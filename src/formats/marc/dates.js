const MARC21_RECORD_STATUS = require('./constants-record-status');
const { getMarkRecordType } = require('./detect');
const { getType } = require('./detect');
const { MARC_RECORD_FORMATS } = require('./constants');

const { MARC21_F008_TYPE_OF_RANGE_OFFSET } = require('./constants-marc21');
const { RUSMARC_F100A_TYPE_OF_RANGE_OFFSET } = require('./constants-unimarc');
const {
  isEmpty,
  isValidDate,
  debug,
  forceArray,
  flatten,
  error,
} = require('../../utils');
const { MARC_SCHEMAS } = require('./constants');
const { getRecordStatus, detectMarcSchemaUri, getKind } = require('./detect');
const { getMarcField } = require('./fields');

const MARC_DATE_TIME_RE = /^([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})(\.[0-9]+)?$/u;

/**
 * TODO: Make more robust and cover by tests
 * @type {RegExp}
 */
const ROMAN_NUMBERS_RE = /(?<![\p{L}\d])M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})(\p{S}*\p{Pd}+\p{S}*M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}))?(?![\p{L}\d])/gu;
// const extractRoman =
/**
 * Documentation: https://www.loc.gov/marc/bibliographic/bd005.html
 * yyyymmddhhmmss.f
 * 19940223151047.0 = [February 23, 1994, 3:10:47 P.M. (15:10:47)]
 *
 * @param sourceRaw
 * @param lowerBound -  should dates strings with 'u' be considered as beginning or and of
 *                      possible dates interval
 * @returns {null|Date}
 */
const parseDateStr = (sourceRaw, lowerBound = false) => {
  const marcDate = sourceRaw.match(MARC_DATE_TIME_RE);
  if (marcDate) {
    const [_, year, month, day, hour, minute, sec, ...other] = marcDate;
    const result = new Date(`${year}-${month}-${day}T${hour}:${minute}:${sec}Z`);
    if (isValidDate(result)) {
      return result;
    }
  }

  const source = sourceRaw
    .replace(/^([0-9]{6})[ u0|#]{2}$/ug, '$101')
    .replace(/^([0-9]{4})[ u0|#]{4}$/ug, '$10101')
    .replace(/^([0-9]{3})[ u0|#]{5}$/ug, '$100101')
    .replace(/^([0-9]{2})[ u0|#]{6}$/ug, '$1000101')

    .replace(/[u#|\[\] ]+/ug, '');
  if (source.match(/^0{4,}/ui)) {
    return null;
  }
  if (source.length === 8) {
    // YYYYMMDD
    const fullDate = new Date([
      source.substr(0, 4),
      '-',
      source.substr(4, 2),
      '-',
      source.substr(6, 2),
      'T00:00:00Z',
    ].join(''));
    if (isValidDate(fullDate)) {
      return fullDate;
    }
  }
  if (
    // YYMMDD
    (source.length === 6)
    && (parseInt(source.substr(2, 2), 10) <= 12)
    && (parseInt(source.substr(2, 2), 10) <= 31)
  ) {
    const year = parseInt(source.substr(0, 2), 10);
    const dateWithMonth = new Date([
      year > 70 ? 1900 + year : 2000 + year,
      '-',
      source.substr(2, 2),
      '-',
      source.substr(4, 2),
      'T00:00:00Z',
    ].join(''));
    if (isValidDate(dateWithMonth)) {
      return dateWithMonth;
    }
  }
  if (sourceRaw.length > 8) {
    const hugeDate = new Date([
      source.substr(0, 4),
      '-',
      source.substr(4, 2),
      '-',
      source.substr(6, 2),
      'T',
      source.substr(8, 2),
      ':',
      source.substr(10, 2),
      ':',
      source.substr(12),
      '00Z',
    ].join(''));
    if (isValidDate(hugeDate)) {
      return hugeDate;
    }
  }

  const sourceYears = sourceRaw.match(/([0-9\-?]{4})/ug);
  if (sourceYears) {
    const dateFromYear = new Date(
      lowerBound
        ? [sourceYears[0].replace(/[u\-#?]/uig, '0'), '01', '01T00:00:00Z'].join('-')
        : [sourceYears[0].replace(/[u\-#?]/uig, '9'), '12', '31T00:00:00Z'].join('-'),
    );
    if (isValidDate(dateFromYear)) {
      return dateFromYear;
    }
  }
  debug(`Can't interpret date string: "${sourceRaw}". Entity 'time_real' property will not be set`);
  return null;
};

const getMarcPublicationDate = (publicationEntity) => {
  const candidates = flatten([
    getMarcField(publicationEntity, '260', 'c'),
    getMarcField(publicationEntity, '260', 'g'),
    getMarcField(publicationEntity, '901', 'c'), // MARC21
    getMarcField(publicationEntity, '210', 'd'), // RUSMARC/UNIMARC
  ]).map(
    v => forceArray(v)[0],
  ).filter(
    v => !!v,
  );
  const vals = candidates.map(
    // v => v.replace(/[\[\]]/uig, '').replace(/\.[^.]*$/ug, '').replace(/[^0-9]/, 'u').replace(/[^0-9]+/ug, ''),
    // ).map(
    v => {
      v ? parseDateStr(v) : null;
    },
  ).filter(
    v => !!v,
  );
  return (vals.length > 0) ? vals[0] : null;
};

const MARC21_DATE_TYPE_PROCESSORS = {
  // b - No dates given; B.C. date involved
  //     One or more dates associated with the item are Before Common Era (B.C.) dates.
  //     B.C. date information can be specifically coded in field 046 (Special Coded Dates).
  b: () => ({
    otherField: '046',
  }),
  // c - Continuing resource currently published
  c: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
    dateEnd: null,  // 9999
  }),
  // d - Continuing resource ceased publication
  d: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
    dateEnd: parseDateStr(s.substr(4, 4), false),
  }),
  // e - Detailed date
  e: s => ({
    dateStart: parseDateStr(s.replace(/##/ug, '01'), true),
    dateEnd: null,
  }),
  // i - Inclusive dates of collection
  i: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
    dateEnd: parseDateStr(s.substr(4, 4), false),
  }),
  // k - Range of years of bulk of collection
  k: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
    dateEnd: parseDateStr(s.substr(4, 4), false),
  }),
  // m - Multiple dates
  m: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
    dateEnd: parseDateStr(s.substr(0, 4), false),

    date2Start: parseDateStr(s.substr(4, 4), true),
    date2End: parseDateStr(s.substr(4, 4), false),
  }),
  // n - Dates unknown
  n: () => ({}),
  '|': () => ({}),
  ' ': () => ({}),
  '#': () => ({}),
  // p - Date of distribution/release/issue and production/recording session when different
  p: (s) => {
    const d1l = parseDateStr(s.substr(0, 4), true);
    const d1u = parseDateStr(s.substr(0, 4), false);
    const d2l = parseDateStr(s.substr(4, 4), true);
    const d2u = parseDateStr(s.substr(4, 4), false);
    const isAsc = (d1l && d2l && (d1l.getTime() < d2l.getTime()));
    const dateStart = d1l && d2l ? (isAsc ? d1l : d2l) : d1l || d2l;
    const dateEnd = d1l && d2l ? (isAsc ? d2u : d1u) : null;
    return {
      dateStart,
      dateEnd,
      dateProduction: dateStart,
      dateDistribution: dateEnd,
    };
  },
  // q - Questionable date
  q: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
    dateEnd: parseDateStr(s.substr(0, 4), false),
  }),
  // r - Reprint/reissue date and original date
  r: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),  // Earliest
    dateEnd: parseDateStr(s.substr(0, 4), false),
    reissueDateStart: parseDateStr(s.substr(4, 4), true),
    reissueDateEnd: parseDateStr(s.substr(4, 4), false),
  }),
  // s - Single known date/probable date
  s: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
    dateEnd: null, // parseDateStr(s.substr(0, 4), false),
  }),
  // 1 - Buggy marc from RSL alef
  1: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
    dateEnd: parseDateStr(s.substr(0, 4), false),
  }),
  // t - Publication date and copyright date
  t: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
    dateEnd: parseDateStr(s.substr(0, 4), false),
    copyrightDateStart: parseDateStr(s.substr(4, 4), true),
    copyrightDateEnd: parseDateStr(s.substr(4, 4), false),
  }),
  // u - Continuing resource status unknown
  u: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
  }),
  // a - NON SPECIFIED CODE FOR FALLBACK
  a: (s) => ({
    dateStart: parseDateStr(s.substr(0, 4), true),
  }),
};


// Используются следующие коды для указания типа даты / дат:
const RUSMARC_DATE_TYPE_PROCESSORS = {
  // a = текущий продолжающийся ресурс
  // Дата 1 содержит год начала публикации. Если дата начала публикации точно не известна, вместо любой неизвестной цифры проставляется символ пробела: '#'.
  // Дата 2 в записи о текущем продолжающемся ресурсе всегда содержит 9999.
  a: MARC21_DATE_TYPE_PROCESSORS.c,

  // b = продолжающийся ресурс, публикация которого прекращена
  //  Дата 1  содержит год начала публикации продолжающегося ресурса.
  //          Если дата начала публикации точно не известна,
  //          вместо любой неизвестной цифры проставляется символ пробела: '#'.
  //  Дата 2  содержит год прекращения издания.
  //          Для ресурсов, о которых известно, что они больше не издаются,
  //          но последняя дата не определена, вместо любой неизвестной цифры
  //          проставляется символ пробела: '#'.
  b: MARC21_DATE_TYPE_PROCESSORS.d,

  // c = продолжающийся ресурс с неизвестным статусом
  // Продолжающийся ресурс, о котором точно не известно, издается ли он сейчас, или его издание прекращено. Дата 1 содержит год начала публикации продолжающегося ресурса. Если дата начала публикации точно не известна, вместо любой неизвестной цифры проставляется знак '#'.
  //  Дата 2  содержит четыре символа пробела: ####.
  c: MARC21_DATE_TYPE_PROCESSORS.u,

  // d = монографический ресурс, изданный в одном томе или изданный в течение одного календарного года
  //
  // Монографический ресурс, изданный в одном томе, либо в нескольких томах, изданных в одно время
  // или с одинаковой датой издания, т.е. изданный в течение одного календарного года.
  // Если дата точно не известна, используется код 'f'.
  // Однако, если дата точно не известна, но указана в Области публикации, производства,
  // распространения и т.д. как единичный год, например, [1769?], или [около 1769],
  // то используется код 'd'.
  //
  // Описание выпуска продолжающегося ресурса или тома многочастного монографического ресурса
  // содержит в позиции 100$a/8 код d.
  //
  // Код 'd' используется также, если известна дата copyright'a, но неизвестна дата издания,
  // иначе говоря, в этом случае дата copyright'a используется вместо даты издания.
  // Если монографический ресурс издавался с интервалом по времени, используется код 'g'.
  //  Дата 1  содержит год издания.
  //  Дата 2  содержит четыре символа пробела: ####.
  d: MARC21_DATE_TYPE_PROCESSORS.s,

  // e = репродуцированный ресурс
  // Каталогизируемый ресурс является репринтом, перепечаткой, факсимильной копией, и т.д., но не новым изданием. Для новых изданий используются коды: 'd', 'f', 'g', или 'h', в соответствии с правилами их применения.
  // Если это продолжающийся ресурс, то указывается начальный год переиздания и начальный год издания.
  //  Дата 1  содержит год издания репродукции.
  //  Дата 2  содержит год издания оригинала.
  // Если одна из дат точно не известна, вместо любой неизвестной цифры указывается символ пробела: '#'.
  e: MARC21_DATE_TYPE_PROCESSORS.r,

  // f = монографический ресурс, дата публикации которого точно не известна
  //  Дата 1  содержит наиболее раннюю из предполагаемых дат издания.
  //  Дата 2  содержит наиболее позднюю из возможных дат издания.
  f: MARC21_DATE_TYPE_PROCESSORS.q,

  // g = монографический ресурс, публикация которого продолжается более года
  //  Дата 1  содержит год начала издания. Если начальная дата издания точно не известна, вместо любой неизвестной цифры проставляется пробел: '#'.
  //  Дата 2  содержит дату окончания издания или 9999, если издание все еще продолжается. Если дата окончания точно не известна, вместо любой неизвестной цифры проставляется пробел: '#'.
  // В редких случаях в одночастном ресурсе (или выпуске сериального ресурса) указаны два года издания. В этих случаях используется код 'g' с соответствующими датами.
  g: MARC21_DATE_TYPE_PROCESSORS.m,

  // h = монографический ресурс с фактической датой публикации и датой присвоения
  // авторского права / привилегии
  // Дата публикации отличается от даты присвоения авторского права / привилегии, указанного
  // в ресурсе. Если дата публикации неизвестна, используется код 'd'.
  // Привилегия определяется как монопольное право, предоставляемое государственныморганом автору
  // или книготорговой организации на издание в течение установленного периода времени.
  //  Дата  1 содержит дату публикации.
  //  Дата  2 содержит дату присвоения авторского права / привилегии.
  h: MARC21_DATE_TYPE_PROCESSORS.t,

  // i = монографический ресурс, имеющий как дату производства, так и дату реализации
  // Используется для фильмов, аудиовизуальных ресурсов и т.д., когда есть различия между датой
  // производства ресурса и датой его реализации.
  //   Дата 1 содержит дату реализации.
  //   Дата 2 содержит дату производства.
  i: MARC21_DATE_TYPE_PROCESSORS.p,

  // j = ресурс с точной датой публикации / создания
  // Используется в случае, когда важно записать месяц (и, возможно, день) публикации / создания.
  //  Дата 1  содержит год публикации / создания.
  //  Дата 2  содержит дату (месяц и день) в формате ММДД, где ММ – обозначение месяца, ДД – дня,
  //          при необходимости с дополнительными нулями.
  // Если день не известен, или не имеет существенного значения, позиции 15 и 16 заполняются
  // символами пробела: '#'.
  j: MARC21_DATE_TYPE_PROCESSORS.e,

  // k = монографический ресурс, даты издания и изготовления которого отличаются
  // Как правило, используется при описании старопечатных изданий.
  //  Дата 1  содержит год издания.
  //  Дата 2  содержит дату изготовления (печати).
  k: MARC21_DATE_TYPE_PROCESSORS.p,

  // l = крайние даты коллекции
  //  Дата 1  содержит наиболее ранний год создания ресурса в коллекции. Если дата точно
  //          не известна, вместо любой неизвестной цифры проставляется символ пробела: '#'.
  //  Дата 2  содержит наиболее поздний год создания ресурса в коллекции. Если дата точно
  //          не известна, вместо любой неизвестной цифры проставляется символ пробела: '#'.
  // Если все ресурсы в коллекции созданы в течение одного календарного года,
  // этот год указывается в качестве Даты 1 и Даты 2.
  l: MARC21_DATE_TYPE_PROCESSORS.i,

  // u = дата(ы) публикации / создания неизвестна(ы)
  // Используется, если дату издания определить невозможно,
  // и никакая дата не может быть присвоена ресурсу.
  //  Дата 1  содержит четыре символа пробела: ####.
  //  Дата 2  содержит четыре символа пробела: ####.
  u: MARC21_DATE_TYPE_PROCESSORS.n,
};


const getMarcRecordDates = (rec, marcSchemaUri = MARC_SCHEMAS.MARC21.uri) => {
  // Fixme: add RusMarc tech field parsing
  marcSchemaUri = detectMarcSchemaUri(rec, marcSchemaUri);
  let extendedDate = {};
  const f005 = getMarcField(rec, '005');
  const recordDateEnd = (getRecordStatus(rec) === MARC21_RECORD_STATUS.DELETED) && f005
    ? parseDateStr(f005)
    : null;
  const recordDateUpdated = f005 ? parseDateStr(f005) : null;
  const f008 = getMarcField(rec, '008');
  const f100a = getMarcField(rec, '100', 'a');

  /*
   RusMarc 801 ind2
   Индикатор 2 : Индикатор функции
   Этот индикатор определяет функцию, выполняемую организацией, название которой помещено в подполе $b.
    0 - Агентство, производящее первоначальную каталогизацию
        Организация, подготовившая данные для записи.
    1 - Агентство, преобразующее данные
        Организация, конвертировавшая данные в машиночитаемую форму
    2 - Агентство, вносящее изменения в запись
        Организация, модифицировавшая содержание записи, либо ее структуру.
    3 - Агентство, распространяющее запись
  */
  const f801c = getMarcField(rec, '801', 'c');

  const getFallbackFn = (typeOfRange) => (dateStr) => {
    if (process.env.DEBUG) {
      error('ERROR No valid date found:', marcSchemaUri, getType(rec), '005:', f005, '008:', f008, '100a:', f100a, '801c:', f801c, 'type:', getKind(rec), `Invalid type of range: "${typeOfRange}" with date string: "${dateStr}", record dates parsing was applied partially.\n${JSON.stringify(rec)}.`);
    }
    return {};
  };
  let recordDateStart;
  let typeOfRange;
  try {
    if (f008 && (marcSchemaUri === MARC_SCHEMAS.MARC21.uri)) {
      recordDateStart = parseDateStr(f008.substr(0, 6)); // 0 - 5
      if (getMarkRecordType(rec) === MARC_RECORD_FORMATS.BIBLIOGRAPHIC) {
        typeOfRange = (f008[MARC21_F008_TYPE_OF_RANGE_OFFSET] || 'n').toLowerCase(); // 6
        const datesStr = f008.substr(7, 8); // 7 - 15
        extendedDate = (MARC21_DATE_TYPE_PROCESSORS[typeOfRange] || getFallbackFn(typeOfRange))(datesStr);
      }
    }
    if ((!recordDateStart) && (f801c || f100a)) {
      if (forceArray(f100a).length > 0) {
        recordDateStart = recordDateStart || parseDateStr(f100a[0].substr(0, 8)); // 0 - 7
        typeOfRange = (f100a[0][RUSMARC_F100A_TYPE_OF_RANGE_OFFSET] || 'n').toLowerCase(); // 8
        const datesStr = f100a ? f100a[0].substr(9, 8) : 'uuuuuuuu';  // 9 - 16
        extendedDate = (RUSMARC_DATE_TYPE_PROCESSORS[typeOfRange] || getFallbackFn(typeOfRange))(datesStr);
      }
      if (f801c && (f801c.length > 0) && (!recordDateStart)) {
        recordDateStart = recordDateStart || parseDateStr(f801c[0]);
      }
    }
  } catch (e) {
    error(e);
    return null;
  }
  const publicationDate = getMarcPublicationDate(rec, marcSchemaUri) || null;
  const result = {
    entity: getType(rec),
    marcRecordType: getMarkRecordType(rec),
    typeOfRange,
    recordDateUpdated,
    recordDateStart: recordDateStart || recordDateUpdated || publicationDate,
    recordDateEnd,
    dateStart: extendedDate.dateStart || publicationDate,
    dateEnd: null,
    date2Start: null,
    date2End: null,
    publicationDate,
    otherField: null,
    ...extendedDate,
  };

  if (result.dateStart && result.dateEnd) {
    if (result.dateStart.getTime() > result.dateEnd.getTime()) {
      error(
        [
          `Got interval date start larger than date end (${result.dateStart} > ${result.dateEnd}),`,
          `auto-fixing: ${JSON.stringify(rec)}`,
        ].join('\n'),
      );
      result.dateStart = result.dateEnd;
    }
  }
  return Object.keys(result).reduce(
    (a, k) => isEmpty(result[k]) ? a : ({
      ...a,
      [k]: result[k],
    }),
    {},
  );
};
module.exports = {
  parseDateStr,
  getMarcRecordDates,
  getMarcPublicationDate,
};
