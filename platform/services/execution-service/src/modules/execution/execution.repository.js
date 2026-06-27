const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── InstallationJob ───────────────────────────────────────────────────────────

const createJob = (data) =>
  prisma.installationJob.create({ data });

const updateJob = (id, data) =>
  prisma.installationJob.update({ where: { id }, data });

const findJobById = (id) =>
  prisma.installationJob.findUnique({ where: { id } });

const findJobs = ({ status, serverId } = {}) =>
  prisma.installationJob.findMany({
    where: {
      ...(status   ? { status }   : {}),
      ...(serverId ? { serverId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

// ── SshCredential ─────────────────────────────────────────────────────────────

const upsertCredential = (serverId, data) =>
  prisma.sshCredential.upsert({
    where:  { serverId },
    update: data,
    create: { serverId, ...data },
  });

const findCredential = (serverId) =>
  prisma.sshCredential.findUnique({ where: { serverId } });

const deleteCredential = (serverId) =>
  prisma.sshCredential.delete({ where: { serverId } });

module.exports = {
  createJob,
  updateJob,
  findJobById,
  findJobs,
  upsertCredential,
  findCredential,
  deleteCredential,
};
