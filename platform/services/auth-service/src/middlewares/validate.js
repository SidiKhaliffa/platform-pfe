const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map((d) => d.message);
    const err = new Error('Validation failed');
    err.status = 400;
    err.details = messages;
    return next(err);
  }
  req[source] = value;
  next();
};
module.exports = validate;
