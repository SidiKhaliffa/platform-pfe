const asyncHandler = require('../../middlewares/asyncHandler');
const service = require('./monitoring.service');

const checkOne = asyncHandler(async (req, res) => {
  const result = await service.checkOne(req.params.serverId);
  res.json(result);
});

const checkAll = asyncHandler(async (req, res) => {
  const results = await service.checkAll();
  res.json(results);
});

const getStatus = asyncHandler(async (req, res) => {
  const status = await service.getStatus();
  res.json(status);
});

const getHistory = asyncHandler(async (req, res) => {
  const history = await service.getHistory(req.params.serverId, req.query.limit);
  res.json(history);
});

module.exports = { checkOne, checkAll, getStatus, getHistory };
