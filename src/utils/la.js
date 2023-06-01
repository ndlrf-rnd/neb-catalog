/**
 * FUNCTION: l2norm( arr[, accessor] )
 *  Calculates the L2 norm (Euclidean norm) of an array.
 *  taken from "compute-l2norm": "1.1.0",
 *
 * @param {Array} arr - input array
 * @returns {Number|Null} L2 norm or null
 */
const l2norm = (arr) => {
  const len = arr.length;
  let t = 0;
  let s = 1;
  let r;
  let val = 0;
  let abs = 0;
  let i;
  if (len === 0) {
    return 0;
  }

  for (i = 0; i < len; i += 1) {
    val = arr[i];
    abs = (val < 0) ? -val : val;
    if (abs > 0) {
      if (abs > t) {
        r = t / val;
        s = 1 + s * r * r;
        t = abs;
      } else {
        r = val / t;
        s += r * r;
      }
    }
  }
  return t * Math.sqrt(s);
};


const sumVectors = (vectors) => {
  if ((!vectors) || (vectors.length === 0)) {
    return [];
  }
  const result = vectors[0].map(() => 0);
  const norms = vectors.map(v => l2norm(v));
  for (let i = 0; i < result.length; i += 1) {
    result[i] = 0;
    for (let j = 0; j < vectors.length; j += 1) {
      result[i] += (vectors[j][i] / norms[j]);
    }
  }
  const resultl2 = l2norm(result);
  return result.map(c => c / resultl2);
};

module.exports = {
  l2norm,
  sumVectors,
};