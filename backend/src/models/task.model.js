const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    'Task',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true, len: [3, 200] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
      },
      assignee_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM('todo', 'in_progress', 'in_review', 'done'),
        allowNull: false,
        defaultValue: 'todo',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      is_overdue: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'tasks',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['project_id'] },
        { fields: ['assignee_id'] },
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['is_overdue'] },
        { fields: ['due_date'] },
      ],
    }
  );

  Task.associate = (db) => {
    Task.belongsTo(db.Project, { foreignKey: 'project_id', as: 'project' });
    Task.belongsTo(db.User, { foreignKey: 'assignee_id', as: 'assignee' });
    Task.belongsTo(db.User, { foreignKey: 'created_by', as: 'creator' });
    Task.hasMany(db.TaskComment, {
      foreignKey: 'task_id',
      as: 'comments',
      onDelete: 'CASCADE',
    });
  };

  return Task;
};
