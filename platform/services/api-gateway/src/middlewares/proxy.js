const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../utils/logger');

// Les headers X-User-Id / X-User-Role sont injectés dans req.headers par le
// middleware d'app.js après vérification JWT — http-proxy-middleware les forward automatiquement.
const buildProxy = (target, pathFilter) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter,
    on: {
      error: (err, req, res) => {
        logger.error('Proxy error', { target, path: req.path, error: err.message });
        if (!res.headersSent) {
          res.status(502).json({ error: { message: 'Service temporarily unavailable' } });
        }
      },
    },
  });

module.exports = buildProxy;
