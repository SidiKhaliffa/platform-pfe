const express = require('express');
const routes = require('./config/routes');
const authenticate = require('./middlewares/authenticate');
const buildProxy = require('./middlewares/proxy');
const logger = require('./utils/logger');

const app = express();

// Pas de express.json() global — le gateway ne doit pas consommer le body
// avant de le proxifier (sinon le stream est épuisé côté service en aval)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// 1. Authentification centralisée
app.use(authenticate);

// 2. Injection des headers user après vérification JWT.
// Fait ici (middleware Express) plutôt que dans le callback proxyReq pour garantir
// que http-proxy-middleware forward toujours les headers mis à jour.
app.use((req, res, next) => {
  // Supprimer tout header X-User-* potentiellement forgé par le client
  delete req.headers['x-user-id'];
  delete req.headers['x-user-role'];
  if (req.user) {
    req.headers['x-user-id']   = req.user.sub;
    req.headers['x-user-role'] = req.user.role;
  }
  next();
});

// 3. Routing proxy — pathFilter fonction pour un match préfixe (pas exact)
// Exemple : '/api/servers' matche '/api/servers' ET '/api/servers/uuid'
routes.forEach(({ prefix, target }) => {
  logger.info(`Route registered: ${prefix} → ${target}`);
  app.use(buildProxy(target, (path) => path === prefix || path.startsWith(prefix + '/')));
});

// 4. 404 pour les routes non déclarées
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

module.exports = app;
