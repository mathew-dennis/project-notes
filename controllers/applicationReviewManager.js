const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Application, User } = require('../models');

// Status each role is allowed to act on (i.e. set by the previous stage)
const queueStatus = {
  doc_reviewer: 'Submitted',
  visa_staff: 'Docs_Verified',
  manager: 'Staff_Reviewed'
};

// 1. Fetch applications based on user role
const getPendingApplications = async (req, res) => {
  const userRole = req.user?.role;

  // Block users without an authorized role
  if (!queueStatus[userRole] && userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized role' });
  }

  try {
    // Admin gets empty where clause (all records); specific roles filter by mapped status
    const statusTarget = userRole === 'admin' ? {} : { status: queueStatus[userRole] };

    const pendingApps = await Application.findAll({
      where: statusTarget,
      attributes: { exclude: ['photo_path', 'doc_path'] },
      include: [{ model: User, attributes: ['first_name', 'last_name', 'email'] }],
      order: [['created_at', 'ASC']]
    });

    return res.status(200).json({ success: true, count: pendingApps.length, data: pendingApps });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper: Decrypt file buffer
const decryptFile = (encryptedDataJson) => {
  if (!encryptedDataJson) return null;

  const { path: relativePath, key, iv } = JSON.parse(encryptedDataJson);
  const absolutePath = path.join(__dirname, '..', relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error('Encrypted file missing on storage.');
  }

  const encryptedBuffer = fs.readFileSync(absolutePath);

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

// 2. Decrypt and stream document (passport or photo)
const viewDocument = async (req, res) => {
  try {
    const { id, type } = req.params;
    const application = await Application.findByPk(id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const rawJsonData = type === 'passport' ? application.doc_path : application.photo_path;
    if (!rawJsonData) {
      return res.status(404).json({ success: false, message: `No ${type} record found.` });
    }

    // Inspect file extension inside stored metadata
    const fileMeta = JSON.parse(rawJsonData);
    const ext = path.extname(fileMeta.path).toLowerCase();

    const decryptedBuffer = decryptFile(rawJsonData);

// Set dynamic Content-Type header
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else {
      res.setHeader('Content-Type', 'image/jpeg');
    }

    return res.send(decryptedBuffer);
  } catch (error) {
    console.error('Error decrypting document:', error);
    return res.status(500).json({ success: false, message: 'Failed to decrypt and serve document.' });
  }
};

// 3. Update application review status
const updateApplicationStatus = async (req, res) => {
  try {
    const { id, decision } = req.params; // 'approved' or 'rejected'

    // Status mapping based on reviewer role and decision
    const statusMap = {
      doc_reviewer: { approved: 'Docs_Verified',      rejected: 'Docs_Rejected' },
      visa_staff:   { approved: 'Staff_Reviewed',     rejected: 'Visa_Rejected' },
      manager:      { approved: 'Manager_Approved',   rejected: 'Manager_Rejected' }
    };

    const userRole = req.user?.role;
    const roleStatuses = statusMap[userRole];

    if (!roleStatuses || !roleStatuses[decision]) {
      return res.status(400).json({ success: false, message: 'Invalid decision or unauthorized role.' });
    }

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Only act on applications the previous stage has passed on
    if (application.status !== queueStatus[userRole]) {
      return res.status(409).json({ success: false, message: 'Application is not awaiting your review.' });
    }

    application.status = roleStatuses[decision];
    await application.save();

    return res.status(200).json({
      success: true,
      message: `Application ${decision} successfully.`,
      data: application
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update application status.' });
  }
};

module.exports = {
  viewDocument,
  getPendingApplications,
  updateApplicationStatus
};