require('dotenv').config();
const { port, rabbitmqUrl, monitoringEnabled, monitoringCron } = require('./config/env');
const app = require('./app');
const publisher = require('./utils/publisher');
const consumer = require('./utils/consumer');
const scheduler = require('./modules/monitoring/monitoring.scheduler');

const start = async () => {
  await publisher.connect(rabbitmqUrl);
  await consumer.connect(rabbitmqUrl);

  if (monitoringEnabled) {
    scheduler.start(monitoringCron);
  }

  app.listen(port, () => {
    console.log(`[monitoring-service] Running on http://localhost:${port}`);
  });
};

start().catch((err) => {
  console.error('[monitoring-service] Fatal startup error:', err);
  process.exit(1);
});
