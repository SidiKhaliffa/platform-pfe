const amqplib = require('amqplib');
const logger = require('./logger');

const EXCHANGE = 'platform.events';
const MAX_RETRY_DELAY_MS = 30000;
let channel = null;
let retryDelay = 1000;

const scheduleReconnect = (url) => {
  logger.warn(`[publisher] Reconnecting in ${retryDelay}ms…`);
  setTimeout(() => connect(url), retryDelay);
  retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
};

const connect = async (url) => {
  try {
    const conn = await amqplib.connect(url);
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    logger.info('[publisher] Connected to RabbitMQ');
    retryDelay = 1000;

    conn.on('error', (err) => { logger.error('[publisher] Connection error', { error: err.message }); channel = null; });
    conn.on('close', ()    => {
      logger.warn('[publisher] Connection closed');
      channel = null;
      scheduleReconnect(url);
    });
  } catch (err) {
    logger.error('[publisher] Failed to connect to RabbitMQ', { error: err.message });
    scheduleReconnect(url);
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
