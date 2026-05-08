const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const jwtConfig = require('../../config/jwt');

const generateTokens = (userId, role) => {
  if (!jwtConfig.accessSecret || !jwtConfig.refreshSecret) {
    throw new Error('JWT secrets are not configured. Check JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in your .env file.');
  }
  const accessToken = jwt.sign({ userId, role }, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
  });
  const refreshToken = jwt.sign({ userId }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password_hash });

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  await user.update({ refresh_token: refreshToken });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email, is_active: true } });
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  await user.update({ refresh_token: refreshToken });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url },
  };
};

const refresh = async (token) => {
  if (!token) {
    const error = new Error('Refresh token required');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtConfig.refreshSecret);
  } catch {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findOne({
    where: { id: decoded.userId, refresh_token: token, is_active: true },
  });

  if (!user) {
    const error = new Error('Refresh token revoked');
    error.statusCode = 401;
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  await user.update({ refresh_token: refreshToken });

  return { accessToken, refreshToken };
};

const logout = async (userId) => {
  await User.update({ refresh_token: null }, { where: { id: userId } });
};

const getMe = async (userId) => {
  return User.findOne({
    where: { id: userId },
    attributes: ['id', 'name', 'email', 'role', 'avatar_url', 'is_active', 'created_at'],
  });
};

module.exports = { register, login, refresh, logout, getMe };
