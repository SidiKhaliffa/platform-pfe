const { pingHost } = require('./monitoring.ping');
const repo = require('./monitoring.repository');
const publisher = require('../../utils/publisher');

const runCheck = async (server) => {
  const { status, latencyMs } = await pingHost(server.ipAddress);
  const healthCheck = await repo.createHealthCheck({ serverId: server.serverId, status, latencyMs });

  if (status === 'DOWN') {
    publisher.publish('server.down', {
      serverId:  server.serverId,
      hostname:  server.hostname,
      ipAddress: server.ipAddress,
      checkedAt: healthCheck.checkedAt,
    });
  }

  return healthCheck;
};

const checkOne = async (serverId) => {
  const server = await repo.findMonitoredServer(serverId);
  if (!server) {
    const err = new Error('Server not registered in monitoring — create it via inventory first');
    err.status = 404;
    throw err;
  }
  if (!server.active) {
    const err = new Error('Server has been deleted');
    err.status = 410;
    throw err;
  }
  return runCheck(server);
};

const checkAll = async () => {
  const servers = await repo.findActiveServers();
  return Promise.all(servers.map(runCheck));
};

const getStatus = async () => {
  const [servers, latestChecks] = await Promise.all([
    repo.findActiveServers(),
    repo.getLatestChecks(),
  ]);
  const checkMap = new Map(latestChecks.map((c) => [c.serverId, c]));
  return servers.map((s) => ({
    serverId:  s.serverId,
    hostname:  s.hostname,
    ipAddress: s.ipAddress,
    lastCheck: checkMap.get(s.serverId) || null,
  }));
};

const getHistory = (serverId, limit) => repo.getHistory(serverId, limit);

module.exports = { checkOne, checkAll, getStatus, getHistory };
