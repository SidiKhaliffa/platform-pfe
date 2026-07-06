const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': '"email" must be a valid email address',
    'any.required': '"email" is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': '"password" must be at least 8 characters',
    'any.required': '"password" is required',
  }),
});

const loginSchema = Joi.object({
  email:    Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
});

// Création d'un compte par un ADMIN — rôle limité à OPERATOR/VIEWER
// (la création d'un ADMIN reste réservée au seed, pas exposée via l'API)
const createUserSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': '"email" must be a valid email address',
    'any.required': '"email" is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': '"password" must be at least 8 characters',
    'any.required': '"password" is required',
  }),
  role: Joi.string().valid('OPERATOR', 'VIEWER').required(),
});

module.exports = { registerSchema, loginSchema, createUserSchema };
