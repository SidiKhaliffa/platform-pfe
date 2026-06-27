const { Router } = require('express');
const controller = require('./monitoring.controller');
const validate = require('../../middlewares/validate');
const authorize = require('../../middlewares/authorize');
const { serverIdParamSchema, historyQuerySchema } = require('./monitoring.validation');

const router = Router();

// Déclenchement manuel — ADMIN ou OPERATOR uniquement
router.post('/check/:serverId',
  authorize('ADMIN', 'OPERATOR'),
  validate(serverIdParamSchema, 'params'),
  controller.checkOne
);

router.post('/check',
  authorize('ADMIN', 'OPERATOR'),
  controller.checkAll
);

// Lecture — tous les rôles authentifiés
router.get('/status',  controller.getStatus);

router.get('/history/:serverId',
  validate(serverIdParamSchema, 'params'),
  validate(historyQuerySchema, 'query'),
  controller.getHistory
);

module.exports = router;
