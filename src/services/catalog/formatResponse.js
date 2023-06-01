const { pick, isError, set, isObject, debug } = require('../../utils');
const { ORDER_DESC, ORDER_DEFAULT } = require('../../constants');
const { toTsv } = require('../../formats/tsv');
const { TSV_MEDIA_TYPE } = require('../../formats/tsv/constants');
const { JSON_MEDIA_TYPE } = require('../../formats/json/constants');
const { encryptCursor } = require('../../crypto/cursor');

const FORMAT_HANDLERS = {
  default: (val) => val,
  [JSON_MEDIA_TYPE]: (val) => val,
  [TSV_MEDIA_TYPE]: val => toTsv(val.publications || val.items || val), // FIXME: remove hardcode serial field unwrap
};

const sendResponse = (status, req, res, resData) => {

  if (isError(resData)) {
    resData = {
      error: (process.env.NODE_ENV === 'test')
        ? `${resData.message}\n${resData.stack}`
        : resData.message || `${resData}`,
      ...pick(resData, ['possibleOptions'], {}),
    };
  }

  if (req.ctx.afterSerial) {
    req.ctx.after = encryptCursor(req.ctx.afterSerial);
  }
  if (req.ctx.beforeSerial) {
    req.ctx.before = encryptCursor(req.ctx.beforeSerial);
  }
  set(resData, ['metadata', 'numberOfPageItems'], req.ctx.numberOfPageItems);
  set(resData, ['metadata', 'order'], (req.ctx.order || ORDER_DEFAULT).toLocaleLowerCase());


  if (req.ctx.after || req.ctx.before) {
    const after = encryptCursor(req.ctx.order === ORDER_DESC ? req.ctx.beforeSerial : req.ctx.afterSerial);
    const before = encryptCursor(req.ctx.order === ORDER_DESC ? req.ctx.afterSerial : req.ctx.beforeSerial);
    const cursors = {
      ...(after ? { after } : {}),
      ...(before ? { before } : {}),
    };

    if (Object.keys(cursors).length > 0) {
      set(resData, ['metadata', 'cursors'], cursors);
    }
  }

  if (req.ctx.extended) {
    if (req.ctx.processingStartTsMs && isObject(resData)) {
      const processingEndTsMs = (new Date()).getTime();
      const processingTimeSec = (processingEndTsMs - req.ctx.processingStartTsMs) / 1000;
      debug(`Processing time: ${processingTimeSec.toFixed(2)}sec`);
      set(resData, ['metadata', 'processingTimeSec'], processingTimeSec);
    }
  }

  res.status(status);
  res.type(req.ctx.mediaType);
  res.set('Content-Type', req.ctx.mediaType);
  res.send((FORMAT_HANDLERS[req.ctx.mediaType] || FORMAT_HANDLERS.default)(resData));
};

module.exports = {
  sendResponse,
};
