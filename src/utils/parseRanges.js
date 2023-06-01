const uniq = require('lodash.uniq');

/**
 * License Note, source of the function below is:
 * https://github.com/euank/node-parse-numeric-range/
 * Under ICS License (Text below):
 *
 * Copyright (c) 2014, Euank <euank@euank.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * © 2020 GitHub, Inc.
 */
/**
 * @param {string} string    The string to parse
 * @returns {Array<number>}  Returns an energetic array.
 */
const parsePart = (string) => {
  let res = [];
  let m;
  for (let str of string.split(',')) {
    // just a number
    if (/^-?\d+$/u.test(str)) {
      res.push(parseInt(str, 10));
    } else if ((m = str.match(/^(-?\d+)(-|\.\.\.?|\u2025|\u2026|\u22EF)(-?\d+)$/))) {
      // 1-5 or 1..5 (equivilant) or 1...5 (doesn't include 5)
      let [_, lhs, sep, rhs] = m;

      if (lhs && rhs) {
        lhs = parseInt(lhs);
        rhs = parseInt(rhs);
        const incr = lhs < rhs ? 1 : -1;

        // Make it inclusive by moving the right 'stop-point' away by one.
        if (sep === '-' || sep === '..' || sep === '\u2025') rhs += incr;

        for (let i = lhs; i !== rhs; i += incr) res.push(i);
      }
    }
  }
  return res;
};
const parseRanges = (rangesStr, maxValue = null, maxStep = null) => {
  const numbers = uniq(
    parsePart(rangesStr || ''),
  ).map(
    (n) => {
      if (n >= 0) {
        return n;
      }
      if ((n < 0) && (maxValue !== null) && (maxValue > 0)) {
        return maxValue + n + 1;
      }
      return null;
    },
  ).filter(
    (n) => (n !== null) && ((!maxValue) || (n <= maxValue)),
  ).sort(
    (a, b) => a - b,
  );
  if (numbers.length === 0) {
    if ((maxValue !== null) && (maxValue > 0)) {
      for (let i = 1; i < maxValue + 1; i += 1) {
        numbers.push(i);
      }
    }
  }

  let prevNumber = null;
  return numbers.reduce(
    (acc, n) => {
      const isSequenceGap = n - prevNumber > 1;
      const isFirstValue = prevNumber === null;
      const isStrideLimit = maxStep
        && (maxStep > 0)
        && (acc.length > 0)
        && ((acc[acc.length - 1].to - acc[acc.length - 1].from) + 1 >= maxStep);
      if (isFirstValue || isSequenceGap || isStrideLimit) {
        acc.push({
          from: n,
          to: n,
        });
      } else {
        acc[acc.length - 1].to = n;
      }
      prevNumber = n;
      return acc;
    },
    [],
  );
};

module.exports = { parseRanges };
