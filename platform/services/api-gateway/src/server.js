const { port } = require('./config/env');
const app = require('./app');
const logger = require('./utils/logger');

const server = app.listen(port, () => {
  logger.info(`API Gateway running on http://localhost:${port}`);
});

const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
