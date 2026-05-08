const dashboardService = require('./dashboard.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user.id, req.user.role);
  return sendSuccess(res, stats);
});

module.exports = { getStats };
