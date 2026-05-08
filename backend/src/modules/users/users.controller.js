const usersService = require('./users.service');
const { sendSuccess, sendError } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const listUsers = asyncHandler(async (req, res) => {
  const result = await usersService.listUsers(req.query);
  return sendSuccess(res, result);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, user);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const user = await usersService.updateUserRole(req.params.id, req.body.role, req.user.id);
  return sendSuccess(res, user, 'Role updated successfully');
});

const deactivateUser = asyncHandler(async (req, res) => {
  await usersService.deactivateUser(req.params.id, req.user.id);
  return sendSuccess(res, null, 'User deactivated successfully');
});

const searchUsers = asyncHandler(async (req, res) => {
  const users = await usersService.searchByEmail(req.query.email);
  return sendSuccess(res, users);
});

module.exports = { listUsers, getUserById, updateUserRole, deactivateUser, searchUsers };
