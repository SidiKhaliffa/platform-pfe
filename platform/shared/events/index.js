// Noms canoniques des events RabbitMQ — importés par tous les services
// pour éviter les fautes de frappe et centraliser les contrats

module.exports = {
  // Inventory → autres services
  SERVER_CREATED: 'server.created',  // payload: { id, hostname, ipAddress, os, tags, status }
  SERVER_UPDATED: 'server.updated',  // payload: { id, ...changedFields }
  SERVER_DELETED: 'server.deleted',  // payload: { id }

  // Monitoring → autres services
  HEALTH_CHECK_COMPLETED: 'healthcheck.completed', // payload: { serverId, status, latencyMs, checkedAt }
  SERVER_STATUS_CHANGED:  'server.status_changed', // payload: { serverId, previous, current }

  // Auth (futur)
  USER_CREATED: 'user.created', // payload: { id, email, role }
};
