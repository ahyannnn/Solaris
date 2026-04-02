const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin, engineer } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const {
  // Customer functions
  getMyProjects,
  getProjectById,
  createProjectFromAcceptance,
  recordPayment,
  
  // Engineer functions
  getEngineerProjects,
  updateProjectProgress,
  uploadProjectPhotos,
  
  // Admin functions
  getAllProjects,
  updateProjectStatus,
  assignEngineerToProject,
  recordProjectPayment,
  getProjectStats,
  createProject
} = require('../controllers/projectController');

const { verifyToken } = authMiddleware;

// ============ CUSTOMER ROUTES ============
router.get('/my-projects', verifyToken, getMyProjects);
router.post('/accept', verifyToken, createProjectFromAcceptance);
router.post('/:id/payments', verifyToken, recordPayment);

// ============ ENGINEER ROUTES ============
router.get('/engineer/my-projects', verifyToken, engineer, getEngineerProjects);
router.put('/:id/progress', verifyToken, engineer, updateProjectProgress);
router.post('/:id/upload-photos', verifyToken, engineer, upload.array('photos', 10), uploadProjectPhotos);

// ============ ADMIN ROUTES ============
router.get('/stats', verifyToken, admin, getProjectStats);
router.get('/', verifyToken, admin, getAllProjects);
router.post('/', verifyToken, admin, createProject);
router.put('/:id/status', verifyToken, admin, updateProjectStatus);
router.put('/:id/assign-engineer', verifyToken, admin, assignEngineerToProject);
router.post('/:id/payments', verifyToken, admin, recordProjectPayment);

// ============ DYNAMIC ROUTES (must be LAST) ============
router.get('/:id', verifyToken, getProjectById);

module.exports = router;