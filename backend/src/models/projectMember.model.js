const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ProjectMember = sequelize.define(
    'ProjectMember',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      role: {
        type: DataTypes.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'project_members',
      timestamps: false,
      indexes: [
        { unique: true, fields: ['project_id', 'user_id'] },
        { fields: ['user_id'] },
      ],
    }
  );

  ProjectMember.associate = (db) => {
    ProjectMember.belongsTo(db.Project, { foreignKey: 'project_id', as: 'project' });
    ProjectMember.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
  };

  return ProjectMember;
};
