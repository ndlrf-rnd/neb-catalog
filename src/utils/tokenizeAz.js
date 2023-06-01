// const Az = require('az');
const Az = function () {
  throw new Error('Currently Az tokenizer is disabled')
}

/*
    expect(result[9].type).to.equal('WORD');      // is
    expect(result[11].type).to.equal('NUMBER');   // 42
    expect(result[12].type).to.equal('PUNCT');    // вопросительный знак

    expect(result[0].subType).to.equal('CYRIL');
    expect(result[2].subType).to.equal('CYRIL');
    expect(result[4].subType).to.equal('CYRIL');
    expect(result[7].subType).to.equal('LATIN');
    expect(result[9].subType).to.equal('LATIN');
 */


/**
 *
 * Gramemes: http://opencorpora.org/dict.php?act=gram
 * @param input
 * @returns {Promise<*>}
 */
const tokenizeAz = input => {
  const noTags = input.replace(/<[\/]?[a-z0-9A-Z\-_]+[^>]*>/uig, '');
  const tokens = Az.Tokens(noTags).done().reduce(
    (a, o) => ([...a, {
      ...o,
      token: o.source.substr(o.st, o.length),
    }]),
    [],
  );
  const filteredTokens = tokens.filter(
    ({ type }) => (
      [
        Az.Tokens.WORD,
        Az.Tokens.NUMBER,
        Az.Tokens.PUNCT,
      ].indexOf(type) !== -1),
  ).map(
    ({ token }) => token,
  );
  return filteredTokens.join(' ');
};

module.exports = {
  tokenizeAz,
}
