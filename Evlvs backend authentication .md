# EVLVS Backend — Authentication (Login + JWT) Guide

Adds a `POST /api/auth/login` endpoint that verifies credentials and issues a JWT, plus a `verifyToken` middleware to protect routes that require a logged-in user.

Two small fixes applied to the pasted code, explained inline below:
1. `loginManager.js` originally imported `bcrypt` (the native, compiled package) — swapped to `bcryptjs`, since that's the package already installed and used for hashing at registration. The hash format is compatible either way, but there's no reason to add a second password-hashing dependency (and `bcrypt` needs native build tools that `bcryptjs` avoids).
2. `loginManager.js` originally hardcoded `JWT_SECRET` without reading `process.env`, while `authenticationManager.js` did. Since the same secret has to sign and verify tokens, both now read from `process.env.JWT_SECRET` with the same fallback.

---

## Step 1: Create `controllers/loginManager.js`

Verifies the email/password and issues a JWT on success.

```js
// controllers/loginManager.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

exports.handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: { id: user.user_id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
```

---

## Step 2: Create `middleware/authenticationManager.js`

Reads the `Authorization: Bearer <token>` header, verifies it, and attaches the decoded payload to `req.user`.

```js
// middleware/authenticationManager.js
const jwt = require('jsonwebtoken');

// Keep secret key consistent across loginManager and authenticationManager
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Token is sent as "Bearer <token_string>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach { userId, role } payload to the request
    next(); // Pass control to the next handler/controller
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};
```

> Both files fall back to the same hardcoded string if `JWT_SECRET` isn't set. That's fine for local dev, but before this goes anywhere real, set `JWT_SECRET` in a `.env` file (you already have `dotenv` installed) so the fallback is never actually relied on.

---

## Step 3: Create `routes/authRoutes.js`

```js
// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const loginManager = require('../controllers/loginManager');
const authenticationManager = require('../middleware/authenticationManager');

// Public route: generate token on login
router.post('/login', loginManager.handleLogin);

// Protected route: require valid token to view profile
router.get('/profile', authenticationManager.verifyToken, (req, res) => {
  res.json({
    message: 'Welcome to your protected profile!',
    user: req.user
  });
});

module.exports = router;
```

---

## Step 4: Mount `authRoutes` in `index.js`

The pasted instructions stopped short of this, but it's needed for any of the above to actually be reachable — add the import and mount alongside the existing registration route:

```js
// index.js
const express = require('express');
const path = require('path');
const sequelize = require('./db');
const { User, Application } = require('./models');
const userRegistrationRoutes = require('./routes/userRegistrationRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'frontend')));

app.use('/api/register', userRegistrationRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

sequelize.sync()
  .then(() => {
    console.log('Database & tables synced successfully!');
    app.listen(5000, () => {
      console.log('Server running on http://localhost:5000');
    });
  })
  .catch(err => console.error('Database sync error:', err));
```

This makes login live at `POST /api/auth/login` and the protected route at `GET /api/auth/profile`.

---

## Step 5: Test It

Log in with a user you already registered:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Copy the `token` from the response, then call the protected route with it:

```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

You should get back `{ "message": "Welcome to your protected profile!", "user": { "userId": ..., "role": ... } }`. Calling `/api/auth/profile` without the header (or with a bad token) should return a 401 or 403 instead.

---

## Folder Architecture

```
evlvs-backend/
├── controllers/
│   ├── newRegistrationManager.js
│   └── loginManager.js
├── middleware/
│   └── authenticationManager.js
├── frontend/
│   ├── index.html
│   ├── admin.html
│   └── dashboard.html
├── models/
│   ├── index.js
│   ├── User.js
│   └── Application.js
├── routes/
│   ├── userRegistrationRoutes.js
│   └── authRoutes.js
├── db.js
├── index.js
└── package.json
```
