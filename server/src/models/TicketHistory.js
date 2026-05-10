// server/src/models/TicketHistory.js
'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class TicketHistory extends Model {}

TicketHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticket_id: { type: DataTypes.UUID, allowNull: false },
    changed_by: { type: DataTypes.UUID, allowNull: false },
    from_status: { type: DataTypes.STRING(20), allowNull: false },
    to_status: { type: DataTypes.STRING(20), allowNull: false },
    note: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'TicketHistory',
    tableName: 'ticket_history',
    timestamps: false,
  }
);

module.exports = TicketHistory;
