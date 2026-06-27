require('dotenv').config();
const { port, rabbitmqUrl } = require('./config/env');
const app = require('./app');
const publisher = require('./utils/publisher');

const start = async () => {
  await publisher.connect(rabbitmqUrl);

  app.listen(port, () => {
    console.log(`[inventory-service] Running on http://localhost:${port}`);
  });
};

start().catch((err) => {
  console.error('[inventory-service] Fatal startup error:', err);
  process.exit(1);
});
