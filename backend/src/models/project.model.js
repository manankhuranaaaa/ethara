const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    'Project',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true, len: [2, 200] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      owner_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM('active', 'archived', 'completed'),
        allowNull: false,
        defaultValue: 'active',
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      tableName: 'projects',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['owner_id'] }, { fields: ['status'] }],
    }
  );

  Project.associate = (db) => {
    Project.belongsTo(db.User, { foreignKey: 'owner_id', as: 'owner' });
    Project.hasMany(db.ProjectMember, {
      foreignKey: 'project_id',
      as: 'members',
      onDelete: 'CASCADE',
    });
    Project.hasMany(db.Task, { foreignKey: 'project_id', as: 'tasks', onDelete: 'CASCADE' });
  };

  return Project;
};
