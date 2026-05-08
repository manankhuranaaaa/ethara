const { Op } = require('sequelize');
const { Project, ProjectMember, User, Task } = require('../../models');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const { logActivity } = require('../../utils/activityLogger');

const memberAttributes = ['id', 'name', 'email', 'avatar_url', 'role'];

const listProjects = async (userId, userRole, query) => {
  const { page, limit, offset } = getPagination(query);
  const { status, search } = query;

  const where = {};
  if (status) where.status = status;
  if (search) where.name = { [Op.iLike]: `%${search}%` };

  if (userRole !== 'admin') {
    const memberships = await ProjectMember.findAll({ where: { user_id: userId }, attributes: ['project_id'] });
    const projectIds = memberships.map((m) => m.project_id);
    where.id = { [Op.in]: projectIds };
  }

  const { count, rows } = await Project.findAndCountAll({
    where,
    include: [
      { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar_url'] },
      { model: ProjectMember, as: 'members', include: [{ model: User, as: 'user', attributes: memberAttributes }] },
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  const projectsWithStats = await Promise.all(
    rows.map(async (project) => {
      const taskCounts = await Task.findAll({
        where: { project_id: project.id },
        attributes: ['status', [Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      });
      const stats = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
      taskCounts.forEach((t) => { stats[t.status] = parseInt(t.count); });
      return { ...project.toJSON(), taskStats: stats };
    })
  );

  return { projects: projectsWithStats, pagination: getPaginationMeta(count, page, limit) };
};

const createProject = async ({ name, description, due_date, userId }) => {
  const project = await Project.create({ name, description, due_date, owner_id: userId });
  await ProjectMember.create({ project_id: project.id, user_id: userId, role: 'admin' });
  await logActivity({ userId, entityType: 'project', entityId: project.id, action: 'created', meta: { name } });
  return project;
};

const getProjectById = async (projectId) => {
  return Project.findOne({
    where: { id: projectId },
    include: [
      { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar_url'] },
      { model: ProjectMember, as: 'members', include: [{ model: User, as: 'user', attributes: memberAttributes }] },
    ],
  });
};

const updateProject = async (projectId, updates, userId) => {
  const project = await Project.findByPk(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  const old = project.toJSON();
  await project.update(updates);
  await logActivity({ userId, entityType: 'project', entityId: projectId, action: 'updated', meta: { before: old, after: updates } });
  return project;
};

const archiveProject = async (projectId, userId) => {
  const project = await Project.findByPk(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  await project.update({ status: 'archived' });
  await logActivity({ userId, entityType: 'project', entityId: projectId, action: 'archived', meta: { name: project.name } });
};

const getMembers = async (projectId) => {
  return ProjectMember.findAll({
    where: { project_id: projectId },
    include: [{ model: User, as: 'user', attributes: memberAttributes }],
  });
};

const addMember = async (projectId, { userId: targetUserId, email, role = 'member' }, actorId) => {
  // Support lookup by email if userId not provided
  let user;
  if (targetUserId) {
    user = await User.findOne({ where: { id: targetUserId, is_active: true } });
  } else if (email) {
    user = await User.findOne({ where: { email, is_active: true } });
  }
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  targetUserId = user.id;

  const existing = await ProjectMember.findOne({ where: { project_id: projectId, user_id: targetUserId } });
  if (existing) {
    const error = new Error('User is already a member');
    error.statusCode = 409;
    throw error;
  }

  const member = await ProjectMember.create({ project_id: projectId, user_id: targetUserId, role });
  await logActivity({ userId: actorId, entityType: 'project', entityId: projectId, action: 'member_added', meta: { targetUserId, role } });
  return member;
};

const removeMember = async (projectId, targetUserId, actorId) => {
  const project = await Project.findByPk(projectId);
  if (project.owner_id === targetUserId) {
    const error = new Error('Cannot remove project owner');
    error.statusCode = 400;
    throw error;
  }

  const deleted = await ProjectMember.destroy({ where: { project_id: projectId, user_id: targetUserId } });
  if (!deleted) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }
  await logActivity({ userId: actorId, entityType: 'project', entityId: projectId, action: 'member_removed', meta: { targetUserId } });
};

module.exports = { listProjects, createProject, getProjectById, updateProject, archiveProject, getMembers, addMember, removeMember };
