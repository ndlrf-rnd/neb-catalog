const detectSubtype = (input, detectors) => {
  const ks = Object.keys(detectors).sort();
  for (let i = 0; i < ks.length; i += 1) {
    if (detectors[ks[i]](input)) {
      return ks[i];
    }
  }
  return false;
};

const detectors = Object.keys(formats.is).reduce(
  (a, o) => ({
    ...a,
    [o]: formats.is[o],
  }),
  {},
);
const detect = (input) => detectSubtype(input, detectors) || (typeof input === 'string' ? 'text/text' : 'object');

module.exports = {
  detectors,
  detect,
}