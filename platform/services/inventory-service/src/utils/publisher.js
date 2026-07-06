const amqplib = require('amqplib');

const EXCHANGE = 'platform.events';
const MAX_RETRY_DELAY_MS = 30000;
let channel = null;
let retryDelay = 1000;

const scheduleReconnect = (url) => {
  console.warn(`[publisher] Reconnecting in ${retryDelay}ms…`);
  setTimeout(() => connect(url), retryDelay);
  retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
};

const connect = async (url) => {
  try {
    const conn = await amqplib.connect(url);
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    console.log('[publisher] Connected to RabbitMQ');
    retryDelay = 1000;

    conn.on('error', (err) => {
      console.error('[publisher] Connection error:', err.message);
      channel = null;
    });
    conn.on('close', () => {
      console.warn('[publisher] Connection closed — events will be dropped until reconnect');
      channel = null;
      scheduleReconnect(url);
    });
  } catch (err) {
    // Service reste opérationnel sans RabbitMQ — les events sont perdus mais les CRUD fonctionnent
    console.error('[publisher] Failed to connect to RabbitMQ:', err.message);
    scheduleReconnect(url);
  }
};

const publish = (routingKey, payload) => {
  if (!channel) {
    console.warn(`[publisher] No channel — event "${routingKey}" dropped`);
    return;
  }
  channel.publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
  console.log(`[publisher] Event published: ${routingKey}`, payload);
};

module.exports = { connect, publish };
