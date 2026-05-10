// database/migrations/XXXXXX-create-notifications.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      ticket_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tickets', key: 'id' },
        onDelete: 'CASCADE',
      },
      message: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true, // null = unread
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['read_at']); // fast unread queries
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
