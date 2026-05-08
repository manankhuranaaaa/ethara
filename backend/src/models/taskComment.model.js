const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const TaskComment = sequelize.define(
    'TaskComment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      task_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
    },
    {
      tableName: 'task_comments',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['task_id'] }, { fields: ['user_id'] }],
    }
  );

  TaskComment.associate = (db) => {
    TaskComment.belongsTo(db.Task, { foreignKey: 'task_id', as: 'task' });
    TaskComment.belongsTo(db.User, { foreignKey: 'user_id', as: 'author' });
  };

  return TaskComment;
};
