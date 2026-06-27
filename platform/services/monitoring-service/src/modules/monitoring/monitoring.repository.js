const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── MonitoredServer ────────────────────────────────────────────────────────────

const upsertMonitoredServer = ({ serverId, ipAddress, hostname }) =>
  prisma.monitoredServer.upsert({
    where:  { serverId },
    create: { serverId, ipAddress, hostname },
    update: { ipAddress, hostname, active: true },
  });

// Soft-delete : on garde l'historique des HealthChecks
const deactivateMonitoredServer = (serverId) =>
  prisma.monitoredServer.updateMany({
    where: { serverId },
    data:  { active: false },
  });

const findActiveServers = () =>
  prisma.monitoredServer.findMany({ where: { active: true } });

const findMonitoredServer = (serverId) =>
  prisma.monitoredServer.findUnique({ where: { serverId } });

// ── HealthCheck ────────────────────────────────────────────────────────────────

const createHealthCheck = (data) => prisma.healthCheck.create({ data });

// Dernier check par serveur (pour le status global)
const getLatestChecks = () =>
  prisma.healthCheck.findMany({
    orderBy:  { checkedAt: 'desc' },
    distinct: ['serverId'],
  });

const getHistory = (serverId, limit = 50) =>
  prisma.healthCheck.findMany({
    where:   { serverId },
    orderBy: { checkedAt: 'desc' },
    take:    limit,
  });

module.exports = {
  upsertMonitoredServer,
  deactivateMonitoredServer,
  findActiveServers,
  findMonitoredServer,
  createHealthCheck,
  getLatestChecks,
  getHistory,
};
