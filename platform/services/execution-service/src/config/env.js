require('dotenv').config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

const encryptionKey = required('ENCRYPTION_KEY');
if (encryptionKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(encryptionKey)) {
  throw new Error(
    'ENCRYPTION_KEY must be a 64-character hex string (32 bytes).\n' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3004,
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
  inventoryServiceUrl: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3002',
  encryptionKey,
  logLevel: process.env.LOG_LEVEL || 'info',
};
