const { ActivityLog } = require('../models');
const logger = require('../config/logger');

const logActivity = async ({ userId, entityType, entityId, action, meta = {} }) => {
  try {
    await ActivityLog.create({ user_id: userId, entity_type: entityType, entity_id: entityId, action, meta });
  } catch (error) {
    logger.error('Failed to write activity log:', error);
  }
};

module.exports = { logActivity };
