// controllers/adminManager.js
const bcrypt = require('bcryptjs');
const { User } = require('../models');

const ALLOWED_ROLES = ['applicant', 'doc_reviewer', 'visa_staff', 'manager', 'admin'];

// 1. Create a new user with any role
exports.createUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields including role are required.' });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}` });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      first_name,
      last_name,
      email,
      password_hash,
      role
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: newUser.user_id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ success: false, message: 'Server error creating user.' });
  }
};

// 2. Fetch all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching users.' });
  }
};

// 3. Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { id, role } = req.params;

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}` });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      user: { id: user.user_id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ success: false, message: 'Server error updating role.' });
  }
};

// 4. Deactivate a user (sets is_active flag)
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Toggle or explicitly set deactivated state
    user.is_active = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.email} has been deactivated.`
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return res.status(500).json({ success: false, message: 'Server error deactivating user.' });
  }
};

// 5. Activate a user (sets is_active flag to true)
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.is_active = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.email} has been reactivated successfully.`
    });
  } catch (error) {
    console.error('Error activating user:', error);
    return res.status(500).json({ success: false, message: 'Server error activating user.' });
  }
};

// 6. Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting user.' });
  }
};