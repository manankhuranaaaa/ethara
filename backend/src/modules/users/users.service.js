const { User } = require('../../models');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const { logActivity } = require('../../utils/activityLogger');

const searchByEmail = async (email) => {
  if (!email || email.length < 2) return [];
  const { Op } = require('sequelize');
  return User.findAll({
    where: { email: { [Op.iLike]: `%${email}%` }, is_active: true },
    attributes: ['id', 'name', 'email', 'avatar_url', 'role'],
    limit: 10,
  });
};

const listUsers = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const { count, rows } = await User.findAndCountAll({
    attributes: ['id', 'name', 'email', 'role', 'avatar_url', 'is_active', 'created_at'],
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });
  return { users: rows, pagination: getPaginationMeta(count, page, limit) };
};

const getUserById = async (id) => {
  return User.findOne({
    where: { id },
    attributes: ['id', 'name', 'email', 'role', 'avatar_url', 'is_active', 'created_at'],
  });
};

const updateUserRole = async (targetId, role, actorId) => {
  const user = await User.findByPk(targetId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  const oldRole = user.role;
  await user.update({ role });
  await logActivity({
    userId: actorId,
    entityType: 'user',
    entityId: targetId,
    action: 'role_changed',
    meta: { from: oldRole, to: role },
  });
  return user;
};

const deactivateUser = async (targetId, actorId) => {
  const user = await User.findByPk(targetId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  await user.update({ is_active: false, refresh_token: null });
  await logActivity({
    userId: actorId,
    entityType: 'user',
    entityId: targetId,
    action: 'deactivated',
    meta: { name: user.name, email: user.email },
  });
};

module.exports = { listUsers, getUserById, updateUserRole, deactivateUser, searchByEmail };
