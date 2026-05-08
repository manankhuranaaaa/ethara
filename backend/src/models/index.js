const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');
const logger = require('../config/logger');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging,
  dialectOptions: config.dialectOptions || {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user.model')(sequelize, Sequelize.DataTypes);
db.Project = require('./project.model')(sequelize, Sequelize.DataTypes);
db.ProjectMember = require('./projectMember.model')(sequelize, Sequelize.DataTypes);
db.Task = require('./task.model')(sequelize, Sequelize.DataTypes);
db.TaskComment = require('./taskComment.model')(sequelize, Sequelize.DataTypes);
db.ActivityLog = require('./activityLog.model')(sequelize, Sequelize.DataTypes);

// Run associations
Object.values(db).forEach((model) => {
  if (model.associate) model.associate(db);
});

db.connect = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = db;
