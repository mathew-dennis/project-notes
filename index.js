const express = require('express');
const path = require('path');
const sequelize = require('./db');
const { User, Application } = require('./models'); // Load models + associations
const userRegistrationRoutes = require('./routes/userRegistrationRoutes'); // Import route

const app = express();
app.use(express.json());

// Serve static HTML/CSS/JS files from the 'frontend' directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Mount the user registration routes
app.use('/api/register', userRegistrationRoutes);

// Default route loads frontend/index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Sync database first, then start server
sequelize.sync()
  .then(() => {
    console.log('Database & tables synced successfully!');
    app.listen(5000, () => {
      console.log('Server running on http://localhost:5000');
    });
  })
  .catch(err => console.error('Database sync error:', err));
