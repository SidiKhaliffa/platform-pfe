const express = require('express');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'inventory-service', timestamp: new Date().toISOString() })
);

app.use('/api/servers', inventoryRoutes);

app.use((req, res) => res.status(404).json({ error: { message: 'Route not found' } }));
app.use(errorHandler);

module.exports = app;
