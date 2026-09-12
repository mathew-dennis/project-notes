const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('evlvs_db', 'root', 'appukutten', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false // Keeps terminal logs clean
});

module.exports = sequelize;
