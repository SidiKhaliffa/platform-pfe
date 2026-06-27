const { Router } = require('express');
const controller = require('./inventory.controller');
const validate = require('../../middlewares/validate');
const authorize = require('../../middlewares/authorize');
const { serverIdParamSchema, createServerSchema, updateServerSchema } = require('./inventory.validation');

const router = Router();

router.get('/',    controller.list);
router.get('/:id', validate(serverIdParamSchema, 'params'), controller.getById);

router.post('/',
  authorize('ADMIN', 'OPERATOR'),
  validate(createServerSchema),
  controller.create
);

router.put('/:id',
  authorize('ADMIN', 'OPERATOR'),
  validate(serverIdParamSchema, 'params'),
  validate(updateServerSchema),
  controller.update
);

router.delete('/:id',
  authorize('ADMIN'),
  validate(serverIdParamSchema, 'params'),
  controller.remove
);

module.exports = router;
