const mime = require('mime');
const formats = require('../../../formats');
const { queryEntities } = require('../../../dao/dao');
const { sendResponse } = require('../formatResponse');
const { pick, debug } = require('../../../utils');

const getRawResource = async (req, res) => {
  debug(`[GET:getRawResource] ${req.ctx.kind}/${req.ctx.source}/${req.ctx.key}`);
  const masterEntities = await queryEntities({
    nodes: [pick(req.ctx, ['kind', 'source', 'key'])],
    ...pick(req.ctx, ['limit', 'order', 'since', 'until']),
  });
  if (masterEntities.length === 0) {
    return sendResponse(404, req, res, `Entity not found: ${req.ctx.kind}/${req.ctx.source}/${req.ctx.key}`);
  }
  const { source, key, record, media_type, provider, time_sys } = masterEntities[0];
  const extension = formats[media_type] ? formats[media_type].extension : mime.getExtension(media_type);
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
    .send(Buffer.from(record));
};

module.exports = {
  getRawResource,
};

