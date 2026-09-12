# EVLVS Backend — Project Setup Guide (WSL)

A step-by-step guide to setting up the `evlvs-backend` Node.js/Express/MySQL project inside WSL.

---

## Prerequisites

- WSL2 installed with a Linux distro (Ubuntu recommended)
- All commands below run **inside the WSL terminal**, not Windows Command Prompt / PowerShell

---

## Step 1: Install Node.js via NVM

Install NVM (Node Version Manager):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Reload your shell environment so `nvm` is available:

```bash
source ~/.bashrc
```

Install and activate the latest Node.js LTS release:

```bash
nvm install --lts
nvm use --lts
```

Verify the install:

```bash
node -v
npm -v
```

---

## Step 2: Initialize the Backend Project

Create the project inside the **Linux filesystem** (not `/mnt/c/...`) for best I/O performance:

```bash
mkdir -p ~/projects/evlvs-backend
cd ~/projects/evlvs-backend
npm init -y
```

Install core dependencies:

```bash
npm install express dotenv mysql2 sequelize jsonwebtoken bcryptjs multer cors
npm install -D nodemon
```

| Package | Purpose |
|---|---|
| express | Web server / routing |
| dotenv | Environment variable loading |
| mysql2 | MySQL driver (used by Sequelize) |
| sequelize | ORM for MySQL |
| jsonwebtoken | JWT auth |
| bcryptjs | Password hashing |
| multer | File uploads |
| cors | Cross-origin request handling |
| nodemon (dev) | Auto-restart on file changes |

---

## Step 3: Set Up MySQL in WSL

### 3.1 Install MySQL Server

```bash
sudo apt update
sudo apt install mysql-server -y
sudo service mysql start
```

### 3.2 Create the Database and Configure the Root User

Log in as root via `sudo` (no password needed on a fresh install):

```bash
sudo mysql
```

At the `mysql>` prompt, create the database and set a root password using the `caching_sha2_password` auth plugin:

```sql
CREATE DATABASE evlvs_db;
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'YOUR_PASSWORD_HERE';
FLUSH PRIVILEGES;
EXIT;
```

> Replace `YOUR_PASSWORD_HERE` with your own password, and use the same value in `db.js` below.

### 3.3 Verify Password Login

Confirm you can log in **without** `sudo`:

```bash
mysql -u root -p
```

---

## Step 4: Database Connection (`db.js`)

Create `db.js` in the project root:

```js
// db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('evlvs_db', 'root', 'YOUR_PASSWORD_HERE', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false // Keeps terminal logs clean
});

module.exports = sequelize;
```

> In practice, move the credentials into a `.env` file (you already installed `dotenv`) instead of hardcoding them:
> ```
> DB_NAME=evlvs_db
> DB_USER=root
> DB_PASSWORD=YOUR_PASSWORD_HERE
> DB_HOST=127.0.0.1
> ```

---

## Step 5: Models — `User.js`, `Application.js`, and Associations

Create the models directory:

```bash
mkdir models
```

### 5.1 `models/User.js`

```js
// models/User.js
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
```

> `role` is an ENUM covering the app's user types: `applicant`, `doc_reviewer`, `visa_staff`, `manager`, `admin`. Only `created_at` is tracked (no `updated_at` column).

### 5.2 `models/Application.js`

```js
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
```

### 5.3 `models/index.js` — Associations

Centralizing associations in one file keeps the foreign key link clean (one user → many applications):

```js
// models/index.js
const User = require('./User');
const Application = require('./Application');

// One User can have Many Applications
User.hasMany(Application, { foreignKey: 'user_id' });
Application.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { User, Application };
```

---

## Step 6: Create `index.js` and Test Table Creation

Create `index.js` in the project root, importing both models (and their associations) from `models/index.js` so Sequelize registers the foreign key before syncing:

```js
// index.js
const express = require('express');
const sequelize = require('./db');
const { User, Application } = require('./models'); // Imports both models and associations

const app = express();
app.use(express.json());

// Sync models with MySQL database
sequelize.sync()
  .then(() => console.log('Database & tables (Users, Applications) synced successfully!'))
  .catch(err => console.error('Database sync error:', err));

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
```

### Before You Start: Ensure MySQL Is Running

MySQL does **not** start automatically in WSL — it stops every time you close your WSL session or restart your machine, so you'll need to start it manually each time before running the app.

Check if it's running:

```bash
sudo service mysql status
```

Start it if it's stopped:

```bash
sudo service mysql start
```

### Run and Verify

Start the server with plain `node` or `nodemon`:

```bash
node index.js
```

You should see:

```
Server running on http://localhost:5000
Database & tables (Users, Applications) synced successfully!
```

If you see this, `sequelize.sync()` has created both the `Users` and `Applications` tables in `evlvs_db`, with `user_id` set up as a foreign key on `Applications` referencing `Users`.

---

## Quick Reference: Folder Structure So Far

```
evlvs-backend/
├── node_modules/
├── models/
│   ├── User.js
│   ├── Application.js
│   └── index.js
├── db.js
├── index.js
├── package.json
└── .env            (recommended, not yet created above)
```
