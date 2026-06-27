const express = require('express');
const monitoringRoutes = require('./modules/monitoring/monitoring.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'monitoring-service', timestamp: new Date().toISOString() })
);

app.use('/api/monitoring', monitoringRoutes);

app.use((req, res) => res.status(404).json({ error: { message: 'Route not found' } }));
app.use(errorHandler);

module.exports = app;
