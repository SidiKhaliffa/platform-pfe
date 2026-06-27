const amqplib = require('amqplib');

const EXCHANGE = 'platform.events';
let channel = null;

const connect = async (url) => {
  try {
    const conn = await amqplib.connect(url);
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    console.log('[publisher] Connected to RabbitMQ');

    conn.on('error', (err) => {
      console.error('[publisher] Connection error:', err.message);
      channel = null;
    });
    conn.on('close', () => {
      console.warn('[publisher] Connection closed — events will be dropped until reconnect');
      channel = null;
    });
  } catch (err) {
    // Service reste opérationnel sans RabbitMQ — les events sont perdus mais les CRUD fonctionnent
    console.error('[publisher] Failed to connect to RabbitMQ:', err.message);
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
