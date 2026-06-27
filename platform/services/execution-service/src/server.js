require('dotenv').config();
const { port, rabbitmqUrl } = require('./config/env');
const app      = require('./app');
const publisher = require('./utils/publisher');
const consumer  = require('./utils/consumer');
const logger    = require('./utils/logger');

async function start() {
  // 1. Connecte le publisher RabbitMQ (pour les events install.completed / install.failed)
  await publisher.connect(rabbitmqUrl);

  // 2. Démarre le worker en parallèle (consumer qui traite les jobs install.requested)
  //    Même process, pas de process.fork — suffisant pour un PFE.
  //    En production : extraire dans un container worker séparé.
  await consumer.connect(rabbitmqUrl);

  // 3. Démarre le serveur HTTP
  app.listen(port, () => {
    logger.info(`[execution-service] Running on port ${port}`);
  });
}

start().catch((err) => {
  console.error('[execution-service] Fatal startup error:', err);
  process.exit(1);
});
