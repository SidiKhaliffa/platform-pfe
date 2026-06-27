require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3002', 10),
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
};
