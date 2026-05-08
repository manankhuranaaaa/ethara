const { ProjectMember, Project } = require('../models');
const { sendError } = require('../utils/response');

const isProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const userId = req.user.id;

    if (req.user.role === 'admin') return next();

    const membership = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    if (!membership) {
      return sendError(res, 'You are not a member of this project', 403);
    }

    req.projectMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

const isProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const userId = req.user.id;

    if (req.user.role === 'admin') return next();

    const project = await Project.findByPk(projectId);
    if (!project) return sendError(res, 'Project not found', 404);

    if (project.owner_id === userId) return next();

    const membership = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: userId, role: 'admin' },
    });

    if (!membership) {
      return sendError(res, 'Project admin access required', 403);
    }

    req.projectMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { isProjectMember, isProjectAdmin };
