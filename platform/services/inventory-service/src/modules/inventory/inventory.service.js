const repo = require('./inventory.repository');
const publisher = require('../../utils/publisher');

const list = () => repo.findAll();

const getById = (id) => repo.findById(id);

const create = async (data) => {
  const server = await repo.create(data);
  publisher.publish('server.created', { serverId: server.id, ipAddress: server.ipAddress, hostname: server.hostname });
  return server;
};

const update = (id, data) => repo.update(id, data);

const remove = async (id) => {
  const server = await repo.remove(id);
  publisher.publish('server.deleted', { serverId: server.id, hostname: server.hostname });
  return server;
};

module.exports = { list, getById, create, update, remove };
