// models/index.js
const User = require('./User');
const Application = require('./Application');

// One User can have Many Applications
User.hasMany(Application, { foreignKey: 'user_id' });
Application.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { User, Application };
