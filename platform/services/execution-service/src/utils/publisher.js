const amqplib = require('amqplib');
const logger = require('./logger');

const EXCHANGE = 'platform.events';
let channel = null;

const connect = async (url) => {
  try {
    const conn = await amqplib.connect(url);
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    logger.info('[publisher] Connected to RabbitMQ');

    conn.on('error', (err) => { logger.error('[publisher] Connection error', { error: err.message }); channel = null; });
    conn.on('close', ()    => { logger.warn('[publisher] Connection closed'); channel = null; });
  } catch (err) {
    logger.error('[publisher] Failed to connect to RabbitMQ', { error: err.message });
  }
};

const publish = (routingKey, payload) => {
  if (!channel) {
    logger.warn(`[publisher] No channel — event "${routingKey}" dropped`);
    return;
  }
  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  logger.info(`[publisher] Event published: ${routingKey}`, payload);
};

module.exports = { connect, publish };
