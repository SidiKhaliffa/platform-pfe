require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3003', 10),
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
  monitoringEnabled: process.env.MONITORING_ENABLED !== 'false',
  monitoringCron: process.env.MONITORING_CRON || '* * * * *',
};
