const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define(
    'ActivityLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entity_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      meta: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      tableName: 'activity_logs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['created_at'] },
      ],
    }
  );

  ActivityLog.associate = (db) => {
    ActivityLog.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
  };

  return ActivityLog;
};
