# EVLVS Frontend — Login & Dashboard Pages

Adds `frontend/login.html`, which posts to `/api/auth/login` and stores the returned JWT in `localStorage`, then redirects to `frontend/dashboard.html` — a page that uses that saved token to fetch the protected `/api/auth/profile` endpoint.

No `index.js` changes are needed for these two pages themselves — they're just new static files served from the existing `express.static(frontend/)` setup. The last step below switches the site's default route over to `login.html` once everything's tested.

---

## Step 1: Create `frontend/login.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EVLVS - Login</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f4f4f9;
    }
    .login-container {
      background: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 320px;
    }
    h2 {
      margin-top: 0;
      margin-bottom: 20px;
      text-align: center;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
    }
    input[type="email"],
    input[type="password"] {
      width: 100%;
      padding: 8px 10px;
      box-sizing: border-box;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      width: 100%;
      padding: 10px;
      background-color: #007bff;
      border: none;
      color: white;
      font-size: 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
    #message {
      margin-top: 15px;
      font-size: 14px;
      text-align: center;
    }
    .register-link {
      margin-top: 20px;
      text-align: center;
      font-size: 14px;
    }
    .register-link a {
      color: #007bff;
      text-decoration: none;
    }
    .register-link a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>

  <div class="login-container">
    <h2>Login</h2>
    <form id="loginForm">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" required placeholder="Enter your email">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" required placeholder="Enter your password">
      </div>
      <button type="submit">Log In</button>
    </form>

    <div id="message"></div>

    <div class="register-link">
      <p>Don't have an account? <a href="/index.html">Register here</a></p>
    </div>
  </div>

  <script>
    const loginForm = document.getElementById('loginForm');
    const messageEl = document.getElementById('message');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageEl.textContent = 'Logging in...';
      messageEl.style.color = 'black';

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Store token in localStorage for subsequent protected API calls
          localStorage.setItem('token', data.token);

          messageEl.style.color = 'green';
          messageEl.textContent = 'Login successful! Redirecting...';

          // Redirect to user dashboard after a short delay
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 1000);
        } else {
          messageEl.style.color = 'red';
          messageEl.textContent = data.message || 'Login failed.';
        }
      } catch (err) {
        console.error('Login error:', err);
        messageEl.style.color = 'red';
        messageEl.textContent = 'Unable to connect to server.';
      }
    });
  </script>

</body>
</html>
```

> Note this already uses the relative path `/api/auth/login` (not a hardcoded `http://localhost:5000/...`) — matches the earlier suggestion for `index.html`.

---

## Step 2: Create `frontend/dashboard.html`

This one wasn't included in the pasted reference (just the question-and-"yes"), so I've written it from scratch to match: on load it reads the token from `localStorage`, redirects back to `login.html` if there isn't one, and otherwise calls `GET /api/auth/profile` with it to display the logged-in user's info. A logout button clears the token and sends you back to the login page.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EVLVS - Dashboard</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f4f4f9;
    }
    .dashboard-container {
      background: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 320px;
      text-align: center;
    }
    h2 {
      margin-top: 0;
      margin-bottom: 20px;
    }
    #userInfo {
      text-align: left;
      background: #f9f9fb;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    #userInfo p {
      margin: 4px 0;
    }
    button {
      width: 100%;
      padding: 10px;
      background-color: #dc3545;
      border: none;
      color: white;
      font-size: 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #a71d2a;
    }
    #message {
      margin-top: 15px;
      font-size: 14px;
      text-align: center;
      color: red;
    }
  </style>
</head>
<body>

  <div class="dashboard-container">
    <h2>Dashboard</h2>
    <div id="userInfo">Loading profile...</div>
    <button id="logoutBtn">Log Out</button>
    <div id="message"></div>
  </div>

  <script>
    const userInfoEl = document.getElementById('userInfo');
    const messageEl = document.getElementById('message');
    const logoutBtn = document.getElementById('logoutBtn');

    const token = localStorage.getItem('token');

    if (!token) {
      // No token at all — send straight back to login
      window.location.href = '/login.html';
    } else {
      fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(async (response) => {
          const data = await response.json();
          if (response.ok) {
            userInfoEl.innerHTML = `
              <p><strong>User ID:</strong> ${data.user.userId}</p>
              <p><strong>Role:</strong> ${data.user.role}</p>
            `;
          } else {
            // Invalid or expired token
            messageEl.textContent = data.message || 'Session expired. Please log in again.';
            localStorage.removeItem('token');
            setTimeout(() => {
              window.location.href = '/login.html';
            }, 1500);
          }
        })
        .catch((err) => {
          console.error('Profile fetch error:', err);
          messageEl.textContent = 'Unable to connect to server.';
        });
    }

    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  </script>

</body>
</html>
```

---

## Step 3: Run and Verify

```bash
sudo service mysql start
node index.js
```

Open **http://localhost:5000/login.html**, log in with a registered user, and confirm you're redirected to the dashboard showing the user ID and role. Clearing `localStorage` (or clicking "Log Out") and reloading `dashboard.html` directly should bounce you back to the login page.

---

## Step 4: Serve the Login Page by Default

Now that login and dashboard are tested, point `index.js`'s default route (`/`) at `login.html` instead of `index.html`, so visitors land on login first (registration is still reachable via the "Register here" link on that page):

```js
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});
```

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
│   ├── login.html
│   ├── dashboard.html
│   └── admin.html
├── models/
│   ├── index.js
│   ├── User.js
│   └── Application.js
├── routes/
│   ├── userRegistrationRoutes.js
│   └── userAuthenticationRoutes.js
├── db.js
├── index.js
└── package.json
```
