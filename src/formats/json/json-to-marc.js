const sortBy = require('lodash.sortby');
const { forceArray } = require('../../utils/arrays');
const { isControlFieldTag } = require('../marc/fields');
const { MARC_BLANK_CHAR } = require('../marc/constants');

const jsonToMarcObject = (rec) => (!(rec.datafield || rec.controlfield))
  ? Object.keys(rec).reduce(
    (a, tag) => {
      if (isControlFieldTag(tag)) {
        a.controlfield.push({
          tag,
          value: rec[tag],
        });
      } else if (tag === 'leader') {
        a[tag] = rec[tag];
      } else {
        const childRecs = forceArray(rec[tag]);
        a.datafield = [
          ...a.datafield,
          ...sortBy(childRecs, 'tag').reduce(
            (ab, df) => ([
              ...ab,
              {
                ind1: df.ind1 || MARC_BLANK_CHAR,
                ind2: df.ind2 || MARC_BLANK_CHAR,
                tag,
                ...(df.value
                    ? { value: df.value }
                    : {
                      subfield: Object.keys(df).filter(
                        k => (k !== 'ind1') && (k !== 'ind2'),
                      ).sort().reduce(
                        (aa, code) => ([
                          ...aa,
                          {
                            value: df[code],
                            code,
                          },
                        ]),
                        [],
                      ),
                    }
                ),
              },
            ]),
            [],
          ),
        ];
      }
      return a;
    },
    {
      datafield: [],
      controlfield: [],
      leader: null,
    },
  )
  : rec;


module.exports = {
  jsonToMarcObject,
};