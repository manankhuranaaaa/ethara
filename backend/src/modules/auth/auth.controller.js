const authService = require('./auth.service');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const jwtConfig = require('../../config/jwt');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.register({ name, email, password });

  res.cookie('refreshToken', result.refreshToken, jwtConfig.refreshCookieOptions);
  return sendCreated(res, { accessToken: result.accessToken, user: result.user }, 'Registration successful');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });

  res.cookie('refreshToken', result.refreshToken, jwtConfig.refreshCookieOptions);
  return sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  const result = await authService.refresh(token);

  res.cookie('refreshToken', result.refreshToken, jwtConfig.refreshCookieOptions);
  return sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie('refreshToken');
  return sendSuccess(res, null, 'Logged out successfully');
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, user);
});

module.exports = { register, login, refresh, logout, getMe };
