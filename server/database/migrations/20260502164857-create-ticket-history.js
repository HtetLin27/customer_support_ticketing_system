'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ticket_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      ticket_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tickets', key: 'id' },
        onDelete: 'CASCADE',
      },
      changed_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      from_status: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      to_status: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      note: {
        type: Sequelize.STRING(500),
        allowNull: true, // optional comment explaining why status changed
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('ticket_history', ['ticket_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ticket_history');
  },
};
