const tasksService = require('./tasks.service');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const listTasks = asyncHandler(async (req, res) => {
  const result = await tasksService.listTasks(req.params.id, req.query);
  return sendSuccess(res, result);
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignee_id, priority, due_date, status } = req.body;
  const task = await tasksService.createTask(
    { title, description, project_id: req.params.id, assignee_id, priority, due_date, status },
    req.user.id
  );
  return sendCreated(res, task);
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await tasksService.getTaskById(req.params.id);
  if (!task) return sendError(res, 'Task not found', 404);
  return sendSuccess(res, task);
});

const updateTask = asyncHandler(async (req, res) => {
  const { title, description, priority, due_date, assignee_id } = req.body;
  const task = await tasksService.updateTask(req.params.id, { title, description, priority, due_date, assignee_id }, req.user.id, req.user.role);
  return sendSuccess(res, task, 'Task updated');
});

const deleteTask = asyncHandler(async (req, res) => {
  await tasksService.deleteTask(req.params.id, req.user.id);
  return sendSuccess(res, null, 'Task deleted');
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await tasksService.updateTaskStatus(req.params.id, req.body.status, req.user.id);
  return sendSuccess(res, task, 'Status updated');
});

const assignTask = asyncHandler(async (req, res) => {
  const task = await tasksService.assignTask(req.params.id, req.body.assignee_id, req.user.id);
  return sendSuccess(res, task, 'Task assigned');
});

module.exports = { listTasks, createTask, getTaskById, updateTask, deleteTask, updateTaskStatus, assignTask };
