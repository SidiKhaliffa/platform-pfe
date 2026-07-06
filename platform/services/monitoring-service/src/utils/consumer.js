const amqplib = require('amqplib');
const repo = require('../modules/monitoring/monitoring.repository');

const EXCHANGE = 'platform.events';
// Queue durable : les messages sont conservés même si le service est redémarré
const QUEUE = 'monitoring.server-sync';
const MAX_RETRY_DELAY_MS = 30000;
let retryDelay = 1000;

const scheduleReconnect = (url) => {
  console.warn(`[consumer] Reconnecting in ${retryDelay}ms…`);
  setTimeout(() => connect(url), retryDelay);
  retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
};

const connect = async (url) => {
  try {
    const conn = await amqplib.connect(url);
    const channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, 'server.created');
    await channel.bindQueue(QUEUE, EXCHANGE, 'server.deleted');

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        const { routingKey } = msg.fields;

        if (routingKey === 'server.created') {
          await repo.upsertMonitoredServer({
            serverId:  payload.serverId,
            ipAddress: payload.ipAddress,
            hostname:  payload.hostname || payload.serverId,
          });
          console.log(`[consumer] Server registered for monitoring: ${payload.serverId} (${payload.ipAddress})`);
        } else if (routingKey === 'server.deleted') {
          await repo.deactivateMonitoredServer(payload.serverId);
          console.log(`[consumer] Server deactivated: ${payload.serverId}`);
        }

        channel.ack(msg);
      } catch (err) {
        console.error('[consumer] Error processing message:', err.message);
        // nack sans requeue → message part en dead-letter (pas de boucle infinie)
        channel.nack(msg, false, false);
      }
    });

    console.log(`[consumer] Listening on queue "${QUEUE}"`);
    retryDelay = 1000;
    conn.on('error', (err) => console.error('[consumer] Connection error:', err.message));
    conn.on('close', () => {
      console.warn('[consumer] Connection closed — reconnecting…');
      scheduleReconnect(url);
    });
  } catch (err) {
    console.error('[consumer] Failed to connect:', err.message);
    scheduleReconnect(url);
  }
};

module.exports = { connect };
