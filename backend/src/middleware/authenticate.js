const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendError } = require('../utils/response');
const jwtConfig = require('../config/jwt');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.accessSecret);

    const user = await User.findOne({
      where: { id: decoded.userId, is_active: true },
      attributes: ['id', 'name', 'email', 'role', 'avatar_url', 'is_active'],
    });

    if (!user) {
      return sendError(res, 'User not found or deactivated', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Access token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid access token', 401);
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Insufficient permissions', 403);
    }
    next();
  };
};

module.exports = { authenticate, authorize };
