const { inventoryServiceUrl } = require('../config/env');
const logger = require('./logger');

/**
 * Appel REST interne vers inventory-service (réseau Docker).
 * On passe x-user-role: ADMIN pour satisfaire le middleware authorize
 * de l'inventory-service (call service-à-service, pas via le gateway).
 */
async function getServer(serverId) {
  const url = `${inventoryServiceUrl}/api/servers/${serverId}`;
  try {
    const res = await fetch(url, {
      headers: { 'x-user-role': 'ADMIN' },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Inventory responded ${res.status}`);
    return res.json();
  } catch (err) {
    logger.error('[inventoryClient] Failed to reach inventory-service', { error: err.message, url });
    throw Object.assign(new Error('Could not reach inventory-service: ' + err.message), { status: 503 });
  }
}

module.exports = { getServer };
