const { services } = require('./env');

// Pour ajouter un nouveau service : une seule ligne ici suffit.
// public: true → le prefix est accessible sans JWT (ex: toute la route /api/auth)
// publicPaths → liste blanche fine à l'intérieur d'un prefix protégé

module.exports = [
  {
    prefix: '/api/auth',
    target: services.auth,
    publicPaths: [
      { path: '/api/auth/login',    method: 'POST' },
      { path: '/api/auth/register', method: 'POST' },
    ],
  },
  {
    prefix: '/api/servers',
    target: services.inventory,
    publicPaths: [],
  },
  {
    prefix: '/api/monitoring',
    target: services.monitoring,
    publicPaths: [],
  },
  {
    prefix: '/api/execution',
    target: services.execution,
    publicPaths: [],
  },
];
