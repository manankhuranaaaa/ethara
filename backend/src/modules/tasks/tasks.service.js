const { Op } = require('sequelize');
const { Task, User, TaskComment, ProjectMember } = require('../../models');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const { logActivity } = require('../../utils/activityLogger');

const userAttributes = ['id', 'name', 'email', 'avatar_url'];

const listTasks = async (projectId, query) => {
  const { page, limit, offset } = getPagination(query);
  const { status, priority, assignee_id, is_overdue, search } = query;

  const where = { project_id: projectId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignee_id) where.assignee_id = assignee_id;
  if (is_overdue !== undefined) where.is_overdue = is_overdue === 'true';
  if (search) where.title = { [Op.iLike]: `%${search}%` };

  const { count, rows } = await Task.findAndCountAll({
    where,
    include: [
      { model: User, as: 'assignee', attributes: userAttributes },
      { model: User, as: 'creator', attributes: userAttributes },
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { tasks: rows, pagination: getPaginationMeta(count, page, limit) };
};

const createTask = async ({ title, description, project_id, assignee_id, priority, due_date, status }, userId) => {
  const task = await Task.create({
    title, description, project_id, assignee_id, priority, due_date, status,
    created_by: userId,
  });
  await logActivity({ userId, entityType: 'task', entityId: task.id, action: 'created', meta: { title, project_id } });
  return task;
};

const getTaskById = async (taskId) => {
  return Task.findOne({
    where: { id: taskId },
    include: [
      { model: User, as: 'assignee', attributes: userAttributes },
      { model: User, as: 'creator', attributes: userAttributes },
      {
        model: TaskComment,
        as: 'comments',
        include: [{ model: User, as: 'author', attributes: userAttributes }],
        order: [['created_at', 'ASC']],
      },
    ],
  });
};

const updateTask = async (taskId, updates, userId, userRole) => {
  const task = await Task.findByPk(taskId);
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  if (userRole !== 'admin') {
    const membership = await ProjectMember.findOne({ where: { project_id: task.project_id, user_id: userId } });
    if (!membership) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    if (membership.role !== 'admin' && task.assignee_id !== userId) {
      const error = new Error('You can only update tasks assigned to you');
      error.statusCode = 403;
      throw error;
    }
  }

  const old = task.toJSON();
  await task.update(updates);
  await logActivity({ userId, entityType: 'task', entityId: taskId, action: 'updated', meta: { before: old, after: updates } });
  return task;
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findByPk(taskId);
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }
  await task.destroy();
  await logActivity({ userId, entityType: 'task', entityId: taskId, action: 'deleted', meta: { title: task.title } });
};

const updateTaskStatus = async (taskId, status, userId) => {
  const task = await Task.findByPk(taskId);
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }
  const oldStatus = task.status;
  const is_overdue = status !== 'done' && task.due_date && new Date(task.due_date) < new Date();
  await task.update({ status, is_overdue });
  await logActivity({ userId, entityType: 'task', entityId: taskId, action: 'status_changed', meta: { from: oldStatus, to: status } });
  return task;
};

const assignTask = async (taskId, assignee_id, userId) => {
  const task = await Task.findByPk(taskId);
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }
  const oldAssignee = task.assignee_id;
  await task.update({ assignee_id });
  await logActivity({ userId, entityType: 'task', entityId: taskId, action: 'assigned', meta: { from: oldAssignee, to: assignee_id } });
  return task;
};

module.exports = { listTasks, createTask, getTaskById, updateTask, deleteTask, updateTaskStatus, assignTask };
