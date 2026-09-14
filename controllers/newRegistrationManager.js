const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Logic for creating a new user
const registerUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    // 1. Basic validation
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // 3. Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 4. Create new user
    const newUser = await User.create({
      first_name,
      last_name,
      email,
      password_hash,
      role: role || 'applicant'
    });

    return res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: newUser.user_id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Database or server error during registration.' });
  }
};

module.exports = { registerUser };
