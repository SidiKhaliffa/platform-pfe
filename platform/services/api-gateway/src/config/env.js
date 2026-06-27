require('dotenv').config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

module.exports = {
  port: parseInt(process.env.PORT) || 3000,
  jwtSecret: required('JWT_SECRET'),
  services: {
    auth:       process.env.AUTH_SERVICE_URL       || 'http://localhost:3001',
    inventory:  process.env.INVENTORY_SERVICE_URL  || 'http://localhost:3002',
    monitoring: process.env.MONITORING_SERVICE_URL || 'http://localhost:3003',
    execution:  process.env.EXECUTION_SERVICE_URL  || 'http://localhost:3004',
  },
};
