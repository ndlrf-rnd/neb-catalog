const crypto = require('crypto');
const fs = require('fs');

const DEFAULT_ENCODING = null;

const md5 = (input, ecoding = DEFAULT_ENCODING) =>
  crypto
    .createHash('md5')
    .update(input, ecoding)
    .digest()
    .toString('hex')
    .toLocaleLowerCase();

const md5File = (filePath, encoding = DEFAULT_ENCODING) =>
  md5(
    fs.readFileSync(filePath, { encoding }),
    encoding,
  );

module.exports = {
  md5,
  md5File,
  DEFAULT_ENCODING,
};
