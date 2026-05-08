const cron = require('node-cron');
const { Op } = require('sequelize');
const { Task } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const logger = require('../config/logger');

const markOverdueTasks = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [updatedCount] = await Task.update(
      { is_overdue: true },
      {
        where: {
          due_date: { [Op.lt]: today },
          status: { [Op.ne]: 'done' },
          is_overdue: false,
        },
      }
    );

    if (updatedCount > 0) {
      const overdueTasks = await Task.findAll({
        where: { due_date: { [Op.lt]: today }, status: { [Op.ne]: 'done' }, is_overdue: true },
        attributes: ['id', 'title', 'project_id'],
      });

      await Promise.all(
        overdueTasks.map((task) =>
          logActivity({
            userId: null,
            entityType: 'task',
            entityId: task.id,
            action: 'marked_overdue',
            meta: { title: task.title, project_id: task.project_id },
          })
        )
      );

      logger.info(`Overdue cron: marked ${updatedCount} tasks as overdue`);
    }
  } catch (error) {
    logger.error('Overdue cron job failed:', error);
  }
};

const startOverdueCron = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', markOverdueTasks, { timezone: 'UTC' });
  logger.info('Overdue detection cron job scheduled (daily at midnight UTC)');
};

module.exports = { startOverdueCron, markOverdueTasks };
