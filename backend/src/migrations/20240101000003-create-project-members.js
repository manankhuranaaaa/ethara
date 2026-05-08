'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_members', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      joined_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('project_members', ['project_id', 'user_id'], { unique: true });
    await queryInterface.addIndex('project_members', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('project_members');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_project_members_role";`);
  },
};
