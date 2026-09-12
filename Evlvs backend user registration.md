# EVLVS Backend — User Registration Setup Guide

Adds a `POST /api/register` endpoint that creates a new `User` row with a bcrypt-hashed password. No authentication is required to register — `bcryptjs` is only needed to hash the password before it's saved to `evlvs_db`.

---

## Step 1: Install `bcryptjs`

In your WSL terminal (`~/projects/evlvs-backend`):

```bash
npm install bcryptjs
```

> Note: `bcryptjs` was already added in the original `npm install` back in Step 2 of the main setup guide, so this is just confirming it's present — safe to run again either way.

---

## Step 2: Create `controllers/newRegistrationManager.js`

Holds the actual logic for creating a new user: validates input, checks for an existing email, hashes the password, and saves the record.

```js
// controllers/newRegistrationManager.js
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Logic for creating a new user
exports.registerUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      email,
      password_hash: hashedPassword,
      role: role || 'applicant'
    });

    res.status(201).json({
      message: 'User created successfully!',
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
```

---

## Step 3: Create `routes/userRegistrationRoutes.js`

Defines the route and points it at the controller function above.

```js
// routes/userRegistrationRoutes.js
const express = require('express');
const router = express.Router();
const registrationManager = require('../controllers/newRegistrationManager');

// Matches POST /api/register
router.post('/', registrationManager.registerUser);

module.exports = router;
```

> Double-check the filename matches `userRegistrationRoutes.js` exactly — a typo here (e.g. `Regisreation`) will break the `require()` in `index.js`.

---

## Step 4: Mount the Route in `index.js`

```js
// index.js
const express = require('express');
const sequelize = require('./db');
const { User, Application } = require('./models');
// Main server imports ONLY the route module HERE
const userRegistrationRoutes = require('./routes/userRegistrationRoutes');

const app = express();
app.use(express.json());

// Express forwards any request to /api/register to the route file
app.use('/api/register', userRegistrationRoutes);

sequelize.sync()
  .then(() => {
    console.log('Database & tables synced successfully!');
    app.listen(5000, () => console.log('Server running on http://localhost:5000'));
  })
  .catch(err => console.error('Database sync error:', err));
```

---

## Step 5: Test the Endpoint

With MySQL running (`sudo service mysql start`) and the server started (`node index.js`), send a test request:

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected response:

```json
{
  "message": "User created successfully!",
  "user": {
    "user_id": 1,
    "email": "test@example.com",
    "role": "applicant"
  }
}
```

Sending the same request again should return a 400 with `"Email is already registered."`

---

## Folder Architecture

```
evlvs-backend/
├── controllers/
│   └── newRegistrationManager.js
├── routes/
│   └── userRegistrationRoutes.js
├── models/
│   ├── index.js
│   ├── User.js
│   └── Application.js
├── db.js
└── index.js
```

Your endpoint is now active at `POST http://localhost:5000/api/register`.
