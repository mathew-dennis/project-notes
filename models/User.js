const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('applicant', 'doc_reviewer', 'visa_staff', 'manager', 'admin'),
    defaultValue: 'applicant'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = User;
