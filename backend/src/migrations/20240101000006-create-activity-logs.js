'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      entity_type: { type: Sequelize.STRING(50), allowNull: false },
      entity_id: { type: Sequelize.UUID, allowNull: false },
      action: { type: Sequelize.STRING(50), allowNull: false },
      meta: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('activity_logs', ['user_id']);
    await queryInterface.addIndex('activity_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('activity_logs', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('activity_logs');
  },
};
