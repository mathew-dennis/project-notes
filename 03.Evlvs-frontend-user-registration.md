# EVLVS Frontend — User Registration Page

Serves a static HTML registration form directly from Express's `frontend/` folder, and wires it up to the existing `POST /api/register` endpoint. Since the page and the API are served from the same origin (`http://localhost:5000`), no `cors` package is needed.

---

## Step 1: Update `index.js` to Serve Static Files

```js
// index.js
const express = require('express');
const path = require('path');
const sequelize = require('./db');
const { User, Application } = require('./models');
const userRegistrationRoutes = require('./routes/userRegistrationRoutes');

const app = express();

app.use(express.json());

// Serve static HTML/CSS/JS files from the 'frontend' directory
app.use(express.static(path.join(__dirname, 'frontend')));

// API Routes
app.use('/api/register', userRegistrationRoutes);

// Default route loads frontend/index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Sync database and start server
sequelize.sync()
  .then(() => {
    console.log('Database & tables synced successfully!');
    app.listen(5000, () => {
      console.log('Server running on http://localhost:5000');
    });
  })
  .catch(err => console.error('Database sync error:', err));
```

> This replaces the `index.js` from the registration guide — same DB sync and `/api/register` mount, plus `express.static` for the frontend and a `/` route that loads `frontend/index.html`.

---

## Step 2: Folder Setup

```
evlvs-backend/
├── controllers/
│   └── newRegistrationManager.js
├── frontend/
│   ├── index.html
│   ├── admin.html
│   └── dashboard.html
├── models/
│   ├── index.js
│   ├── User.js
│   └── Application.js
├── routes/
│   └── userRegistrationRoutes.js
├── db.js
├── index.js
└── package.json
```

`admin.html` and `dashboard.html` are placeholders for later pages — only `index.html` is built out below.

---

## Step 3: Create `frontend/index.html`

A form for email, role, password, and password confirmation, which posts to `/api/register` and shows the result inline.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>User Registration</title>
</head>
<body>

  <h2>User Registration</h2>

  <form id="registrationForm">
    <!-- Email Field -->
    <label for="email">Email:</label><br>
    <input type="email" id="email" required><br><br>

    <!-- Role Field -->
    <label for="role">Role:</label><br>
    <input type="text" id="role" placeholder="applicant" value="applicant"><br><br>

    <!-- Password Field -->
    <label for="password">Password:</label><br>
    <input type="password" id="password" required><br><br>

    <!-- Confirm Password Field -->
    <label for="confirmPassword">Confirm Password:</label><br>
    <input type="password" id="confirmPassword" required><br><br>

    <button type="submit">Register</button>
  </form>

  <!-- Status / Error Messages -->
  <p id="statusMsg"></p>

  <script>
    const form = document.getElementById('registrationForm');
    const statusMsg = document.getElementById('statusMsg');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = document.getElementById('email').value;
      const role = document.getElementById('role').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      // Reset status message
      statusMsg.textContent = '';
      statusMsg.style.color = 'black';

      // 1. Password Matching Validation
      if (password !== confirmPassword) {
        statusMsg.style.color = 'red';
        statusMsg.textContent = 'Passwords do not match.';
        return;
      }

      // 2. Send Data to Backend
      try {
        const response = await fetch('http://localhost:5000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
          statusMsg.style.color = 'green';
          statusMsg.textContent = data.message || 'Registration successful!';
          form.reset();
        } else {
          statusMsg.style.color = 'red';
          statusMsg.textContent = data.error || 'Registration failed.';
        }
      } catch (err) {
        console.error('Connection error:', err);
        statusMsg.style.color = 'red';
        statusMsg.textContent = 'Server is unreachable. Please make sure the backend is running.';
      }
    });
  </script>

</body>
</html>
```

> Since the page is now served from the same origin as the API (`http://localhost:5000`), the `fetch` URL could be shortened to the relative path `/api/register` instead of the full `http://localhost:5000/api/register` — either works here, but the relative form keeps working if the port or host ever changes.

---

## Step 4: Run and Verify

```bash
sudo service mysql start
node index.js
```

Open **http://localhost:5000** in a browser — it should load the registration form directly (no separate frontend server needed). Submit it and confirm you see the green "Registration successful!" message, then check the row landed in MySQL:

```bash
mysql -u root -p -e "SELECT * FROM Users;" evlvs_db
```
