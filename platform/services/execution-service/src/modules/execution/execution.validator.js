const Joi    = require('joi');
const catalog = require('../../config/catalog');

const validSoftwareKeys = Object.keys(catalog);

const installSchema = Joi.object({
  serverId:    Joi.string().uuid().required(),
  softwareKey: Joi.string().valid(...validSoftwareKeys).required()
    .messages({ 'any.only': `softwareKey must be one of: ${validSoftwareKeys.join(', ')}` }),
});

const credentialSchema = Joi.object({
  serverId:  Joi.string().uuid().required(),
  sshUser:   Joi.string().min(1).required(),
  port:      Joi.number().integer().min(1).max(65535).default(22),
  host:      Joi.string().optional(), // surcharge hostname/IP pour SSH (ex: "ssh-target")
  authType:  Joi.string().valid('PASSWORD', 'KEY').required(),
  secret:    Joi.string().min(1).required()
    .description('Mot de passe ou contenu de la clé privée — sera chiffré avant stockage'),
});

const jobFilterSchema = Joi.object({
  status:   Joi.string().valid('PENDING', 'RUNNING', 'SUCCESS', 'FAILED').optional(),
  serverId: Joi.string().uuid().optional(),
});

const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(
    source === 'query' ? req.query : req.body,
    { abortEarly: false, allowUnknown: false }
  );
  if (error) {
    return res.status(400).json({
      error: {
        message: 'Validation error',
        details: error.details.map((d) => d.message),
      },
    });
  }
  if (source === 'query') req.query = value;
  else                    req.body  = value;
  next();
};

module.exports = { installSchema, credentialSchema, jobFilterSchema, validate };
