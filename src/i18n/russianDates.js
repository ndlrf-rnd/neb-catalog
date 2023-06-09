// Source: https://github.com/explosion/spaCy/blob/f580302673ae16c673619603632378e5d390dacd/spacy/lang/ru/tokenizer_exceptions.py
// Tests: https://github.com/moment/moment/blob/2e2a5b35439665d4b0200143d808a7c26d6cd30f/src/locale/ru.js
const PHONEMES = [
  {
    ORTH: 'пн',
    LEMMA: 'понедельник',
    NORM: 'понедельник',
  },
  {
    ORTH: 'вт',
    LEMMA: 'вторник',
    NORM: 'вторник',
  },
  {
    ORTH: 'ср',
    LEMMA: 'среда',
    NORM: 'среда',
  },
  {
    ORTH: 'чт',
    LEMMA: 'четверг',
    NORM: 'четверг',
  },
  {
    ORTH: 'чтв',
    LEMMA: 'четверг',
    NORM: 'четверг',
  },
  {
    ORTH: 'пт',
    LEMMA: 'пятница',
    NORM: 'пятница',
  },
  {
    ORTH: 'сб',
    LEMMA: 'суббота',
    NORM: 'суббота',
  },
  {
    ORTH: 'сбт',
    LEMMA: 'суббота',
    NORM: 'суббота',
  },
  {
    ORTH: 'вс',
    LEMMA: 'воскресенье',
    NORM: 'воскресенье',
  },
  {
    ORTH: 'вскр',
    LEMMA: 'воскресенье',
    NORM: 'воскресенье',
  },
  {
    ORTH: 'воскр',
    LEMMA: 'воскресенье',
    NORM: 'воскресенье',
  },
  // Months abbreviations
  {
    ORTH: 'янв',
    LEMMA: 'январь',
    NORM: 'январь',
  },
  {
    ORTH: 'фев',
    LEMMA: 'февраль',
    NORM: 'февраль',
  },
  {
    ORTH: 'февр',
    LEMMA: 'февраль',
    NORM: 'февраль',
  },
  {
    ORTH: 'мар',
    LEMMA: 'март',
    NORM: 'март',
  },
  // {ORTH: "март", LEMMA: "март", NORM: "март"},
  {
    ORTH: 'мрт',
    LEMMA: 'март',
    NORM: 'март',
  },
  {
    ORTH: 'апр',
    LEMMA: 'апрель',
    NORM: 'апрель',
  },
  // {ORTH: "май", LEMMA: "май", NORM: "май"},
  {
    ORTH: 'июн',
    LEMMA: 'июнь',
    NORM: 'июнь',
  },
  // {ORTH: "июнь", LEMMA: "июнь", NORM: "июнь"},
  {
    ORTH: 'июл',
    LEMMA: 'июль',
    NORM: 'июль',
  },
  // {ORTH: "июль", LEMMA: "июль", NORM: "июль"},
  {
    ORTH: 'авг',
    LEMMA: 'август',
    NORM: 'август',
  },
  {
    ORTH: 'сен',
    LEMMA: 'сентябрь',
    NORM: 'сентябрь',
  },
  {
    ORTH: 'сент',
    LEMMA: 'сентябрь',
    NORM: 'сентябрь',
  },
  {
    ORTH: 'окт',
    LEMMA: 'октябрь',
    NORM: 'октябрь',
  },
  {
    ORTH: 'октб',
    LEMMA: 'октябрь',
    NORM: 'октябрь',
  },
  {
    ORTH: 'ноя',
    LEMMA: 'ноябрь',
    NORM: 'ноябрь',
  },
  {
    ORTH: 'нояб',
    LEMMA: 'ноябрь',
    NORM: 'ноябрь',
  },
  {
    ORTH: 'нбр',
    LEMMA: 'ноябрь',
    NORM: 'ноябрь',
  },
  {
    ORTH: 'дек',
    LEMMA: 'декабрь',
    NORM: 'декабрь',
  },
];
// https://github.com/moment/moment/blob/2e2a5b35439665d4b0200143d808a7c26d6cd30f/src/test/locale/ru.js

// http://new.gramota.ru/spravka/rules/139-prop : § 103
// Сокращения месяцев: http://new.gramota.ru/spravka/buro/search-answer?s=242637
// CLDR data:          http://www.unicode.org/cldr/charts/28/summary/ru.html#1753
/*
   function plural$4(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }
    function relativeTimeWithPlural$3(number, withoutSuffix, key) {
        var format = {
            'ss': withoutSuffix ? 'секунда_секунды_секунд' : 'секунду_секунды_секунд',
            'mm': withoutSuffix ? 'минута_минуты_минут' : 'минуту_минуты_минут',
            'hh': 'час_часа_часов',
            'dd': 'день_дня_дней',
            'MM': 'месяц_месяца_месяцев',
            'yy': 'год_года_лет'
        };
        if (key === 'm') {
            return withoutSuffix ? 'минута' : 'минуту';
        }
        else {
            return number + ' ' + plural$4(format[key], +number);
        }
    }
    var monthsParse$6 = [/^янв/i, /^фев/i, /^мар/i, /^апр/i, /^ма[йя]/i, /^июн/i, /^июл/i, /^авг/i, /^сен/i, /^окт/i, /^ноя/i, /^дек/i];

 */
/*
momentLocaleRu = {
  months: {
    format: 'января_февраля_марта_апреля_мая_июня_июля_августа_сентября_октября_ноября_декабря'.split('_'),
    standalone: 'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split('_'),
  },
  monthsShort: {
    // по CLDR именно "июл." и "июн.", но какой смысл менять букву на точку ?
    format: 'янв._февр._мар._апр._мая_июня_июля_авг._сент._окт._нояб._дек.'.split('_'),
    standalone: 'янв._февр._март_апр._май_июнь_июль_авг._сент._окт._нояб._дек.'.split('_'),
  },
  weekdays: {
    standalone: 'воскресенье_понедельник_вторник_среда_четверг_пятница_суббота'.split('_'),
    format: 'воскресенье_понедельник_вторник_среду_четверг_пятницу_субботу'.split('_'),
    isFormat: /\[ ?[Вв] ?(?:прошлую|следующую|эту)? ?\] ?dddd/,
  },
  weekdaysShort: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
  weekdaysMin: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
  monthsParse: monthsParse$6,
  longMonthsParse: monthsParse$6,
  shortMonthsParse: monthsParse$6,

  // полные названия с падежами, по три буквы, для некоторых, по 4 буквы, сокращения с точкой и без точки
  monthsRegex: /^(январ[ья]|янв\.?|феврал[ья]|февр?\.?|марта?|мар\.?|апрел[ья]|апр\.?|ма[йя]|июн[ья]|июн\.?|июл[ья]|июл\.?|августа?|авг\.?|сентябр[ья]|сент?\.?|октябр[ья]|окт\.?|ноябр[ья]|нояб?\.?|декабр[ья]|дек\.?)/i,

  // копия предыдущего
  monthsShortRegex: /^(январ[ья]|янв\.?|феврал[ья]|февр?\.?|марта?|мар\.?|апрел[ья]|апр\.?|ма[йя]|июн[ья]|июн\.?|июл[ья]|июл\.?|августа?|авг\.?|сентябр[ья]|сент?\.?|октябр[ья]|окт\.?|ноябр[ья]|нояб?\.?|декабр[ья]|дек\.?)/i,

  // полные названия с падежами
  monthsStrictRegex: /^(январ[яь]|феврал[яь]|марта?|апрел[яь]|ма[яй]|июн[яь]|июл[яь]|августа?|сентябр[яь]|октябр[яь]|ноябр[яь]|декабр[яь])/i,

  // Выражение, которое соотвествует только сокращённым формам
  monthsShortStrictRegex: /^(янв\.|февр?\.|мар[т.]|апр\.|ма[яй]|июн[ья.]|июл[ья.]|авг\.|сент?\.|окт\.|нояб?\.|дек\.)/i,
  longDateFormat: {
    LT: 'H:mm',
    LTS: 'H:mm:ss',
    L: 'DD.MM.YYYY',
    LL: 'D MMMM YYYY г.',
    LLL: 'D MMMM YYYY г., H:mm',
    LLLL: 'dddd, D MMMM YYYY г., H:mm',
  },
  calendar: {
    sameDay: '[Сегодня, в] LT',
    nextDay: '[Завтра, в] LT',
    lastDay: '[Вчера, в] LT',
    nextWeek: function (now) {
      if (now.week() !== this.week()) {
        switch (this.day()) {
        case 0:
          return '[В следующее] dddd, [в] LT';
        case 1:
        case 2:
        case 4:
          return '[В следующий] dddd, [в] LT';
        case 3:
        case 5:
        case 6:
          return '[В следующую] dddd, [в] LT';
        }
      } else {
        if (this.day() === 2) {
          return '[Во] dddd, [в] LT';
        } else {
          return '[В] dddd, [в] LT';
        }
      }
    },
    lastWeek: function (now) {
      if (now.week() !== this.week()) {
        switch (this.day()) {
        case 0:
          return '[В прошлое] dddd, [в] LT';
        case 1:
        case 2:
        case 4:
          return '[В прошлый] dddd, [в] LT';
        case 3:
        case 5:
        case 6:
          return '[В прошлую] dddd, [в] LT';
        }
      } else {
        if (this.day() === 2) {
          return '[Во] dddd, [в] LT';
        } else {
          return '[В] dddd, [в] LT';
        }
      }
    },
    sameElse: 'L',
  },
  relativeTime: {
    future: 'через %s',
    past: '%s назад',
    s: 'несколько секунд',
    ss: relativeTimeWithPlural$3,
    m: relativeTimeWithPlural$3,
    mm: relativeTimeWithPlural$3,
    h: 'час',
    hh: relativeTimeWithPlural$3,
    d: 'день',
    dd: relativeTimeWithPlural$3,
    M: 'месяц',
    MM: relativeTimeWithPlural$3,
    y: 'год',
    yy: relativeTimeWithPlural$3,
  },
  meridiemParse: /ночи|утра|дня|вечера/i,
  isPM: function (input) {
    return /^(дня|вечера)$/.test(input);
  },
  meridiem: function (hour, minute, isLower) {
    if (hour < 4) {
      return 'ночи';
    } else if (hour < 12) {
      return 'утра';
    } else if (hour < 17) {
      return 'дня';
    } else {
      return 'вечера';
    }
  },
  dayOfMonthOrdinalParse: /\d{1,2}-(й|го|я)/,
  ordinal: function (number, period) {
    switch (period) {
    case 'M':
    case 'd':
    case 'DDD':
      return number + '-й';
    case 'D':
      return number + '-го';
    case 'w':
    case 'W':
      return number + '-я';
    default:
      return number;
    }
  },
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4,  // The week that contains Jan 4th is the first week of the year.
  },
};
*/