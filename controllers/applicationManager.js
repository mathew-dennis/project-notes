// controllers/applicationManager.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Application, User } = require('../models');

// Encryption helper function
const encryptAndSaveFile = (fileBuffer, originalName) => {
  if (!fileBuffer) return null;

  const algorithm = 'aes-256-cbc';
  const key = crypto.randomBytes(32); // 256-bit key
  const iv = crypto.randomBytes(16);  // Initialization vector

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);

  const uniqueFileName = `${Date.now()}_${originalName}.enc`;
  const uploadPath = path.join(__dirname, '../uploads', uniqueFileName);

  fs.writeFileSync(uploadPath, encryptedBuffer);

  return JSON.stringify({
    path: `uploads/${uniqueFileName}`,
    key: key.toString('hex'),
    iv: iv.toString('hex')
  });
};

// POST: Create a new application
const createApplication = async (req, res) => {
  try {
    const { first_name, last_name, visa_type, passport_number } = req.body;
    const user_id = req.user.userId;

    const userProfile = await User.findByPk(user_id);
    if (!userProfile || userProfile.first_name !== first_name || userProfile.last_name !== last_name) {
      return res.status(403).json({ error: 'The provided name does not match the authenticated profile.' });
    }

    let photoData = null;
    let docData = null;

    if (req.files && req.files['photo']) {
      photoData = encryptAndSaveFile(req.files['photo'][0].buffer, req.files['photo'][0].originalname);
    }
    if (req.files && req.files['passport']) {
      docData = encryptAndSaveFile(req.files['passport'][0].buffer, req.files['passport'][0].originalname);
    }

    const newApplication = await Application.create({
      user_id,
      visa_type,
      passport_number,
      photo_path: photoData,
      doc_path: docData
    });

    return res.status(201).json({ 
      message: 'Application created successfully with encrypted documents!', 
      application: newApplication 
    });
  } catch (error) {
    console.error('Application creation error:', error);
    return res.status(500).json({ error: 'Failed to create application.' });
  }
};

// GET: Fetch all applications for the authenticated user
const getUserApplications = async (req, res) => {
  try {
    // Extract user_id variable from authenticated token payload
    const user_id = req.user.userId;

    // Retrieve all application records matching user_id
    const applications = await Application.findAll({
      where: { user_id },
      order: [['created_at', 'DESC']] // Return newest applications first
    });

    return res.status(200).json({ applications });
  } catch (error) {
    console.error('Fetch applications error:', error);
    return res.status(500).json({ error: 'Failed to retrieve applications.' });
  }
};

module.exports = { 
  createApplication,
  getUserApplications 
};