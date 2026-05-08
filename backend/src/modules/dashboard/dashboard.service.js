const { Op, literal, fn, col } = require('sequelize');
const { Task, Project, ProjectMember, ActivityLog, User } = require('../../models');

const getStats = async (userId, userRole) => {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  let projectWhere = {};
  let taskWhere = {};

  if (userRole !== 'admin') {
    const memberships = await ProjectMember.findAll({ where: { user_id: userId }, attributes: ['project_id'] });
    const projectIds = memberships.map((m) => m.project_id);
    projectWhere.id = { [Op.in]: projectIds };
    taskWhere.project_id = { [Op.in]: projectIds };
  }

  const [
    totalProjects,
    taskStatusCounts,
    overdueCount,
    myAssignedTasks,
    recentActivity,
    upcomingDueDates,
    tasksDueToday,
    recentProjects,
  ] = await Promise.all([
      Project.count({ where: projectWhere }),

      Task.findAll({
        where: taskWhere,
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),

      Task.count({ where: { ...taskWhere, is_overdue: true } }),

      Task.count({ where: { ...taskWhere, assignee_id: userId, status: { [Op.ne]: 'done' } } }),

      ActivityLog.findAll({
        where: userRole === 'admin' ? {} : { user_id: userId },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),

      Task.findAll({
        where: {
          ...taskWhere,
          due_date: { [Op.between]: [today, sevenDaysFromNow] },
          status: { [Op.ne]: 'done' },
        },
        include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'avatar_url'] }],
        order: [['due_date', 'ASC']],
        limit: 10,
      }),

      Task.findAll({
        where: {
          ...taskWhere,
          due_date: { [Op.between]: [today, todayEnd] },
          status: { [Op.ne]: 'done' },
        },
        include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'avatar_url'] }],
        order: [['priority', 'DESC']],
        limit: 5,
      }),

      Project.findAll({
        where: { ...projectWhere, status: 'active' },
        include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url'] }],
        order: [['updated_at', 'DESC']],
        limit: 4,
      }),
    ]);

  const tasksByStatus = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
  let totalTasks = 0;
  taskStatusCounts.forEach((t) => {
    tasksByStatus[t.status] = parseInt(t.count);
    totalTasks += parseInt(t.count);
  });

  // Build priority breakdown from tasks in scope
  const taskPriorityCounts = await Task.findAll({
    where: taskWhere,
    attributes: ['priority', [fn('COUNT', col('id')), 'count']],
    group: ['priority'],
    raw: true,
  });
  const tasksByPriority = { low: 0, medium: 0, high: 0, critical: 0 };
  taskPriorityCounts.forEach((t) => { tasksByPriority[t.priority] = parseInt(t.count); });

  return {
    totalProjects,
    totalTasks,
    tasksByStatus,
    tasksByPriority,
    overdueCount,
    myAssignedTasks,
    recentActivity,
    upcomingDueDates,
    tasksDueToday,
    recentProjects,
  };
};

module.exports = { getStats };
