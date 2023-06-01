const FETCH_OPTIONS = {
  // headers: {
  //   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.87 Safari/537.36',
  // },
};

const isIssnL = gel => (!!gel['@type']) && forceArray(gel['@type']).reduce(
  (a, o) => a || o.toUpperCase().endsWith('ISSNL'),
  false,
);

const fetchIssnL = async issnLStr => JSON.parse(JSON.stringify(await (await fetch(
  `https://portal.issn.org/resource/ISSN-L/${issnLStr}?format=json`,
  FETCH_OPTIONS,
)).json()));

const fetchIssn = async issnStr => JSON.parse(JSON.stringify(await (await fetch(
  `https://portal.issn.org/resource/ISSN/${issnStr}?format=json`,
  FETCH_OPTIONS,
)).json()));


module.exports = {
  isIssnL,
  fetchIssn,
  fetchIssnL,
};