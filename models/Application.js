// models/Application.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Application = sequelize.define('Application', {
  app_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Matches the table name created by User.js
      key: 'user_id'
    }
  },
  visa_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  passport_number: {
    type: DataTypes.STRING(255), // Set length to 255 to accommodate encrypted string data
    allowNull: false
  },
  photo_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  doc_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Draft'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Application;
