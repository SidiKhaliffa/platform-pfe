const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return res.status(404).json({ error: { message: 'Resource not found' } });
  }
  const status = err.status || 500;
  const body = { error: { message: err.message || 'Internal Server Error' } };
  if (err.details) body.error.details = err.details;
  if (status === 500) console.error('[Unhandled Error]', err);
  res.status(status).json(body);
};

module.exports = errorHandler;
