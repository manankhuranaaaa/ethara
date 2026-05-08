const logger = require('../config/logger');
const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, _next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return sendError(res, `${field} already exists`, 409);
  }

  // Sequelize foreign key constraint
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return sendError(res, 'Referenced resource not found', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') return sendError(res, 'Invalid token', 401);
  if (err.name === 'TokenExpiredError') return sendError(res, 'Token expired', 401);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  return sendError(res, message, statusCode);
};

const notFound = (req, res) => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
};

module.exports = { errorHandler, notFound };
