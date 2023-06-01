const mime = require('mime');
const formats = require('../../../formats');
const { queryEntities } = require('../../../dao/dao');
const { sendResponse } = require('../formatResponse');
const { pick, debug } = require('../../../utils');

const getResourceExport = async (req, res) => {
  debug(`[GET:getResourceExport] ${req.ctx.kind}/${req.ctx.source}/${req.ctx.key}`);
  const masterEntities = await queryEntities({
    nodes: [pick(req.ctx, ['kind', 'source', 'key'])],
    ...pick(req.ctx, ['limit', 'order', 'since', 'until']),
  });
  if (masterEntities.length === 0) {
    return sendResponse(404, req, res, `Entity not found: ${req.ctx.kind}/${req.ctx.source}/${req.ctx.key}`);
  }
  const { source, key, record, media_type, provider, time_sys } = masterEntities[0];
  const targetMediaType = req.ctx.export.replace(/ /ug, '+');
  const extension = formats[targetMediaType] ? formats[targetMediaType].extension : mime.getExtension(targetMediaType);
  const to = formats[media_type] ? formats[media_type].to : {};
  if (!to[targetMediaType]) {
    return sendResponse(402, req, res, {
      error: `[GET:getResourceExport] No conversion way "${media_type}" -> "${targetMediaType}"`,
      possibleFormats: Object.keys(formats[media_type].to),
    });
  }
  const convertedRecord = await to[targetMediaType](record);
  res
    .status(200)
    .attachment(
      [
        `seed`,
        req.ctx.kind,
        source,
        key,
        provider,
        Math.floor(((new Date(time_sys)).getTime() / 1000)),
      ].map(
        seg => encodeURIComponent(seg),
      ).join('__') + `.${extension}`,
    )
    .send(Buffer.from(convertedRecord));
};

module.exports = {
  getResourceExport,
};

