'use strict';
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Notification extends Model {}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: { type: DataTypes.UUID, allowNull: false },
    ticket_id: { type: DataTypes.UUID, allowNull: false },
    message: { type: DataTypes.STRING(255), allowNull: false },
    read_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: false,
  }
);

module.exports = Notification;
