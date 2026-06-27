const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const routes = require('../config/routes');
const logger = require('../utils/logger');

// Construit un Set de clés "METHOD /path" pour la recherche O(1)
const publicSet = new Set(
  routes.flatMap((r) => r.publicPaths.map((p) => `${p.method} ${p.path}`))
);

const isPublic = (req) => publicSet.has(`${req.method} ${req.path}`);

const authenticate = (req, res, next) => {
  if (isPublic(req)) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Missing or invalid Authorization header' } });
  }

  try {
    req.user = jwt.verify(authHeader.slice(7), jwtSecret);
    logger.debug('Authenticated', { userId: req.user.sub, role: req.user.role, path: req.path });
    next();
  } catch (err) {
    logger.warn('Invalid token', { error: err.message, path: req.path });
    res.status(401).json({ error: { message: 'Token invalid or expired' } });
  }
};

module.exports = authenticate;
