const amqplib = require('amqplib');
const service  = require('../modules/execution/execution.service');
const logger   = require('./logger');

const EXCHANGE = 'platform.events';
const QUEUE    = 'execution.install-requests';
const MAX_RETRY_DELAY_MS = 30000;
let retryDelay = 1000;

const scheduleReconnect = (url) => {
  logger.warn(`[consumer] Reconnecting in ${retryDelay}ms…`);
  setTimeout(() => connect(url), retryDelay);
  retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
};

const connect = async (url) => {
  try {
    const conn    = await amqplib.connect(url);
    const channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, 'install.requested');

    // Traitement séquentiel : un job à la fois (prefetch 1)
    channel.prefetch(1);

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;
      let payload;
      try {
        payload = JSON.parse(msg.content.toString());
        logger.info('[consumer] Received install.requested', { jobId: payload.jobId });
        await service.processInstallJob(payload);
        channel.ack(msg);
      } catch (err) {
        logger.error('[consumer] Error processing message', { error: err.message, payload });
        // nack sans requeue pour éviter une boucle infinie
        channel.nack(msg, false, false);
      }
    });

    logger.info(`[consumer] Listening on queue "${QUEUE}"`);
    retryDelay = 1000;
    conn.on('error', (err) => logger.error('[consumer] Connection error', { error: err.message }));
    conn.on('close', ()    => {
      logger.warn('[consumer] Connection closed — reconnecting…');
      scheduleReconnect(url);
    });
  } catch (err) {
    logger.error('[consumer] Failed to connect to RabbitMQ', { error: err.message });
    scheduleReconnect(url);
  }
};

module.exports = { connect };
