const Joi = require('joi');

const serverIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const createServerSchema = Joi.object({
  hostname: Joi.string().min(1).required(),
  ipAddress: Joi.string().ip().required(),
  os: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional().default([]),
  status: Joi.string().valid('ONLINE', 'OFFLINE', 'UNKNOWN').optional(),
});

const updateServerSchema = Joi.object({
  hostname: Joi.string().min(1),
  ipAddress: Joi.string().ip(),
  os: Joi.string().allow(null),
  tags: Joi.array().items(Joi.string()),
  status: Joi.string().valid('ONLINE', 'OFFLINE', 'UNKNOWN'),
}).min(1);

module.exports = { serverIdParamSchema, createServerSchema, updateServerSchema };
