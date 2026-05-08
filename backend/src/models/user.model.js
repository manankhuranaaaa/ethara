const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true, len: [2, 100] },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      avatar_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ unique: true, fields: ['email'] }, { fields: ['role'] }],
    }
  );

  User.associate = (db) => {
    User.hasMany(db.Project, { foreignKey: 'owner_id', as: 'ownedProjects' });
    User.hasMany(db.ProjectMember, { foreignKey: 'user_id', as: 'projectMemberships' });
    User.hasMany(db.Task, { foreignKey: 'assignee_id', as: 'assignedTasks' });
    User.hasMany(db.Task, { foreignKey: 'created_by', as: 'createdTasks' });
    User.hasMany(db.TaskComment, { foreignKey: 'user_id', as: 'comments' });
    User.hasMany(db.ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });
  };

  return User;
};
