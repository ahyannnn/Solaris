const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');
const {
  getApplications,
  getLatestPublished,
  createApplication,
  updateApplication,
  deleteApplication,
  publishApplication,
  uploadMiddleware
} = require('../controllers/applicationController');

// Public route - no auth required
router.get('/latest', getLatestPublished);

// Admin routes
router.get('/', verifyToken, admin, getApplications);
router.post('/', verifyToken, admin, uploadMiddleware, createApplication);
router.put('/:id', verifyToken, admin, uploadMiddleware, updateApplication);
router.put('/:id/publish', verifyToken, admin, publishApplication);
router.delete('/:id', verifyToken, admin, deleteApplication);

module.exports = router;