const projectsService = require('./projects.service');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const listProjects = asyncHandler(async (req, res) => {
  const result = await projectsService.listProjects(req.user.id, req.user.role, req.query);
  return sendSuccess(res, result);
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description, due_date } = req.body;
  const project = await projectsService.createProject({ name, description, due_date, userId: req.user.id });
  return sendCreated(res, project);
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectsService.getProjectById(req.params.id);
  if (!project) return sendError(res, 'Project not found', 404);
  return sendSuccess(res, project);
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description, status, due_date } = req.body;
  const project = await projectsService.updateProject(req.params.id, { name, description, status, due_date }, req.user.id);
  return sendSuccess(res, project, 'Project updated');
});

const archiveProject = asyncHandler(async (req, res) => {
  await projectsService.archiveProject(req.params.id, req.user.id);
  return sendSuccess(res, null, 'Project archived');
});

const getMembers = asyncHandler(async (req, res) => {
  const members = await projectsService.getMembers(req.params.id);
  return sendSuccess(res, members);
});

const addMember = asyncHandler(async (req, res) => {
  const member = await projectsService.addMember(req.params.id, req.body, req.user.id);
  return sendCreated(res, member, 'Member added');
});

const removeMember = asyncHandler(async (req, res) => {
  await projectsService.removeMember(req.params.id, req.params.userId, req.user.id);
  return sendSuccess(res, null, 'Member removed');
});

module.exports = { listProjects, createProject, getProjectById, updateProject, archiveProject, getMembers, addMember, removeMember };
