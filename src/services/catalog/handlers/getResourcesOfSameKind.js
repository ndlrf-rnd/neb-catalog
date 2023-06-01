const { resourceOfSameKindGroup } = require('../groups/resourcesOfSameKindGroup');
const { sendResponse } = require('../formatResponse');
const {error} = require('../../../utils')
const getResourcesOfSameKind = async (req, res) => {
  try {
    return sendResponse(200, req, res, await resourceOfSameKindGroup(req.ctx));
  } catch (e) {
    error(e)
    return sendResponse(404, req, res, e);
  }
};

module.exports = {
  resourceOfSameKindGroup,
  getResourcesOfSameKind,
};
