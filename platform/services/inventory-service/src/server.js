require('dotenv').config();
const { port, rabbitmqUrl } = require('./config/env');
const app = require('./app');
const publisher = require('./utils/publisher');
const consumer  = require('./utils/consumer');

const start = async () => {
  await publisher.connect(rabbitmqUrl);
  await consumer.connect(rabbitmqUrl);

  app.listen(port, () => {
    console.log(`[inventory-service] Running on http://localhost:${port}`);
  });
};

start().catch((err) => {
  console.error('[inventory-service] Fatal startup error:', err);
  process.exit(1);
});

//sss
