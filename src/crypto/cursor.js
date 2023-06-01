const jwt = require('jsonwebtoken');
const { sanitizeEntityKind, forceArray } = require('../utils');
const { ENCRYPT_CURSORS, CURSOR_ENCRYPTION_SECRET } = require('../constants');

const encryptCursor = (
  cursorArr,
  secret = CURSOR_ENCRYPTION_SECRET,
) => {
  cursorArr = forceArray(cursorArr);
  if ((forceArray(cursorArr).length === 2) || (forceArray(cursorArr).length === 3)) {
    const cursorStr = [
      ...cursorArr.slice(0, cursorArr.length - 1).map(sanitizeEntityKind),
      cursorArr[cursorArr.length - 1],
    ].join('-');
    if (ENCRYPT_CURSORS) {
      return jwt.sign(cursorStr, secret);
    } else {
      return cursorStr;
    }
  } else {
    return null;
  }
};

const decryptCursor = (encryptedText, secret = CURSOR_ENCRYPTION_SECRET) => {
  const cursorStr = ENCRYPT_CURSORS
    ? jwt.decode(encryptedText, secret)
    : encryptedText;
  const cursorArr = cursorStr.split('-');
  if ((cursorArr.length === 2) || (cursorArr.length === 3)) {
    return [
      ...cursorArr.slice(0, cursorArr.length - 1).map(sanitizeEntityKind),
      parseInt(`${cursorArr[cursorArr.length - 1]}`, 10),
    ];
  } else {
    return null;
  }
};

module.exports = {
  encryptCursor,
  decryptCursor,
};
// enc_AdDLmzUgWiLo6oHGCI53S5begiKOfNZBY0affrLMWgheBzfwMA7XSKmgjyNbuZBIptdXc18j1Se0Dm7vEsePh1SoM3
// eyJhbGciOiJIUzI1NiJ9.NDQ2NzM.d2WeVMUm94lMX6EWu0YZtqVDXC5csIcE0pIF9lxhSKs
