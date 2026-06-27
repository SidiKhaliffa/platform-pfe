const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const findByEmail = (email) => prisma.user.findUnique({ where: { email } });
const findById   = (id)    => prisma.user.findUnique({ where: { id } });
const create     = (data)  => prisma.user.create({ data });

module.exports = { findByEmail, findById, create };
