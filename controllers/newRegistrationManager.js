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
