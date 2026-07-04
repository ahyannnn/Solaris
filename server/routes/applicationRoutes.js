// server/routes/applicationRoutes.js
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

// ============ PUBLIC ROUTE ============
// No authentication required
router.get('/latest', getLatestPublished);

// ============ ADMIN ROUTES ============
// All routes below require authentication and admin role

// GET all applications
router.get('/', verifyToken, admin, getApplications);

// POST - Create new application (upload APK)
router.post('/', verifyToken, admin, uploadMiddleware, createApplication);

// ✅ PUT - Publish an application (SPECIFIC ROUTE - MUST BE FIRST)
// This must come before /:id to avoid being caught by the generic route
router.put('/:id/publish', verifyToken, admin, publishApplication);

// PUT - Update an application (GENERIC ROUTE - PUT THIS LAST)
router.put('/:id', verifyToken, admin, uploadMiddleware, updateApplication);

// DELETE - Delete an application
router.delete('/:id', verifyToken, admin, deleteApplication);

module.exports = router;