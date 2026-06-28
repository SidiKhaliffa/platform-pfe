const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const findAll = () => prisma.server.findMany({ orderBy: { createdAt: 'desc' } });
const findById = (id) => prisma.server.findUniqueOrThrow({ where: { id } });
const create = (data) => prisma.server.create({ data });
const update = (id, data) => prisma.server.update({ where: { id }, data });
const remove = (id) => prisma.server.delete({ where: { id } });

// Appelé par le consumer RabbitMQ — updateMany évite un crash si le serveur a été supprimé
const updateStatus = (serverId, status) =>
  prisma.server.updateMany({ where: { id: serverId }, data: { status } });

module.exports = { findAll, findById, create, update, remove, updateStatus };
