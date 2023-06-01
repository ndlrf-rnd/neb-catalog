const { isControlFieldTag } = require('../marc/fields');
const { isDataFieldTag } = require('../marc/fields');
const { flatten } = require('express');

const marcObjectFromJson = (rec) => ({
  leader: rec.leader,
  controlfield: flatten(
    Object.keys(rec).filter(
      k => isControlFieldTag(k),
    ).map(
      k => forceArray(rec[k]).map(
        fieldRec => ({
          field: k,
          value: fieldRec,
        }),
      ),
    ),
  ),
  datafield: flatten(
    Object.keys(rec).filter(
      k => isDataFieldTag(k),
    ).map(
      k => forceArray(rec[k]).map(
        fieldRec => ({
          field: k,
          ...fieldRec,
        }),
      ),
    ),
  ),
});

module.exports = {
  marcObjectFromJson,
};
