const amqplib = require('amqplib');
const repo = require('../modules/inventory/inventory.repository');

const EXCHANGE = 'platform.events';
const QUEUE    = 'inventory.status-sync';
const MAX_RETRY_DELAY_MS = 30000;
let retryDelay = 1000;

const scheduleReconnect = (url) => {
  console.warn(`[consumer] Reconnecting in ${retryDelay}ms…`);
  setTimeout(() => connect(url), retryDelay);
  retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
};

const connect = async (url) => {
  try {
    const conn    = await amqplib.connect(url);
    const channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, 'server.up');
    await channel.bindQueue(QUEUE, EXCHANGE, 'server.down');

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;
      try {
        const payload     = JSON.parse(msg.content.toString());
        const { routingKey } = msg.fields;

        if (routingKey === 'server.up') {
          await repo.updateStatus(payload.serverId, 'ONLINE');
          console.log(`[consumer] Status → ONLINE : ${payload.serverId}`);
        } else if (routingKey === 'server.down') {
          await repo.updateStatus(payload.serverId, 'OFFLINE');
          console.log(`[consumer] Status → OFFLINE : ${payload.serverId}`);
        }

        channel.ack(msg);
      } catch (err) {
        console.error('[consumer] Error processing message:', err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log(`[consumer] Listening on queue "${QUEUE}" (server.up / server.down)`);
    retryDelay = 1000;
    conn.on('error', (err) => console.error('[consumer] Connection error:', err.message));
    conn.on('close', () => {
      console.warn('[consumer] Connection closed — reconnecting…');
      scheduleReconnect(url);
    });
  } catch (err) {
    // Le service reste opérationnel sans RabbitMQ — statuts non mis à jour
    console.error('[consumer] Failed to connect to RabbitMQ:', err.message);
    scheduleReconnect(url);
  }
};

module.exports = { connect };
