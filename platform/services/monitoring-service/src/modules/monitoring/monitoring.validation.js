const Joi = require('joi');

const serverIdParamSchema = Joi.object({
  serverId: Joi.string().uuid().required(),
});

const historyQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(500).default(50),
});

module.exports = { serverIdParamSchema, historyQuerySchema };
