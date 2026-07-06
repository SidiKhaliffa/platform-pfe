const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const findByEmail = (email) => prisma.user.findUnique({ where: { email } });
const findById   = (id)    => prisma.user.findUnique({ where: { id } });
const create     = (data)  => prisma.user.create({ data });

// select explicite pour ne jamais faire remonter le hash du password
const findAll = () => prisma.user.findMany({
  select: { id: true, email: true, role: true, createdAt: true },
  orderBy: { createdAt: 'desc' },
});

module.exports = { findByEmail, findById, create, findAll };
