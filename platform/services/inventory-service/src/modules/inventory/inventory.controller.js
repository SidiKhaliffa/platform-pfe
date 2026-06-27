const asyncHandler = require('../../middlewares/asyncHandler');
const service = require('./inventory.service');

const list = asyncHandler(async (req, res) => {
  const servers = await service.list();
  res.json(servers);
});

const getById = asyncHandler(async (req, res) => {
  const server = await service.getById(req.params.id);
  res.json(server);
});

const create = asyncHandler(async (req, res) => {
  const server = await service.create(req.body);
  res.status(201).json(server);
});

const update = asyncHandler(async (req, res) => {
  const server = await service.update(req.params.id, req.body);
  res.json(server);
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.status(204).send();
});

module.exports = { list, getById, create, update, remove };
