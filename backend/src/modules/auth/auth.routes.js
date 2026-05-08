const express = require('express');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const authController = require('./auth.controller');
const { registerValidators, loginValidators } = require('./auth.validators');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { sendError } = require('../../utils/response');

const router = express.Router();

const loginRateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  duration: (parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 900000) / 1000,
});

const loginLimiterMiddleware = async (req, res, next) => {
  try {
    await loginRateLimiter.consume(req.ip);
    next();
  } catch {
    return sendError(res, 'Too many login attempts. Try again in 15 minutes.', 429);
  }
};

router.post('/register', registerValidators, validate, authController.register);
router.post('/login', loginLimiterMiddleware, loginValidators, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
