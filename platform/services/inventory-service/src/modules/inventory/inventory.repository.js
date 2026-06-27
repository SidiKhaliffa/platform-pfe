const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const findAll = () => prisma.server.findMany({ orderBy: { createdAt: 'desc' } });
const findById = (id) => prisma.server.findUniqueOrThrow({ where: { id } });
const create = (data) => prisma.server.create({ data });
const update = (id, data) => prisma.server.update({ where: { id }, data });
const remove = (id) => prisma.server.delete({ where: { id } });

module.exports = { findAll, findById, create, update, remove };
