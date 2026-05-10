'use strict';

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Ticket extends Model {}

Ticket.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { len: [5, 255] },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { len: [10, 5000] },
    },
    status: {
      type: DataTypes.ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'open',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Ticket',
    tableName: 'tickets',
    timestamps: false,
  }
);

module.exports = Ticket;
