const amqplib = require('amqplib');

const EXCHANGE = 'platform.events';
let channel = null;

const connect = async (url) => {
  try {
    const conn = await amqplib.connect(url);
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    console.log('[publisher] Connected to RabbitMQ');
    conn.on('error', (err) => { console.error('[publisher] Error:', err.message); channel = null; });
    conn.on('close', () => { console.warn('[publisher] Connection closed'); channel = null; });
  } catch (err) {
    console.error('[publisher] Failed to connect:', err.message);
  }
};

const publish = (routingKey, payload) => {
  if (!channel) {
    console.warn(`[publisher] No channel — event "${routingKey}" dropped`);
    return;
  }
  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  console.log(`[publisher] Event published: ${routingKey}`, payload);
};

module.exports = { connect, publish };
