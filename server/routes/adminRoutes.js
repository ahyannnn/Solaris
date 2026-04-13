// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

// User Management Controllers
const userControllers = require('../controllers/userManagementControllers');
const deviceControllers = require('../controllers/deviceControllers');
const revenueControllers = require('../controllers/revenueControllers');
const reportController = require('../controllers/reportController');

const { verifyToken } = authMiddleware;

// Apply admin middleware to all routes
router.use(verifyToken, admin);

// ============ USER MANAGEMENT ============
router.get('/users', userControllers.getAllUsers);
router.get('/users/stats', userControllers.getUserStats);
router.get('/users/:id', userControllers.getUserById);
router.post('/users', userControllers.createUser);
router.put('/users/:id', userControllers.updateUser);
router.put('/users/:id/role', userControllers.updateUserRole);
router.put('/users/:id/toggle-status', userControllers.toggleUserStatus);
router.put('/users/:id/reset-password', userControllers.resetUserPassword);
router.delete('/users/:id', userControllers.deleteUser);

// ============ DEVICE MANAGEMENT ============
router.get('/devices', deviceControllers.getAllDevices);
router.get('/devices/stats', deviceControllers.getDeviceStats);
router.get('/devices/:id', deviceControllers.getDeviceById);
router.post('/devices', deviceControllers.createDevice);
router.put('/devices/:id', deviceControllers.updateDevice);
router.delete('/devices/:id', deviceControllers.deleteDevice);
router.post('/devices/:deviceId/assign', deviceControllers.assignDeviceToEngineer);

// ============ REVENUE ============
router.get('/revenue', revenueControllers.getRevenueStats);
router.get('/revenue/monthly', revenueControllers.getMonthlyRevenue);
router.post('/revenue/range', revenueControllers.getRevenueByDateRange);

// ============ REPORTS & ANALYTICS ============

// Site Assessment Reports
// GET: Get site assessment report data
router.get('/reports/site-assessment', reportController.getSiteAssessmentReport);
// POST: Export site assessment report (CSV, PDF, XLSX)
router.post('/reports/site-assessment/export', reportController.exportSiteAssessmentReport);

// Project Summary Reports
// GET: Get project summary report data
router.get('/reports/project-summary', reportController.getProjectSummaryReport);
// POST: Export project summary report (CSV, PDF, XLSX)
router.post('/reports/project-summary/export', reportController.exportProjectSummaryReport);

// Financial Reports
// GET: Get financial report data
router.get('/reports/financial', reportController.getFinancialReport);
// POST: Export financial report (CSV, PDF, XLSX)
router.post('/reports/financial/export', reportController.exportFinancialReport);

// Client Transaction Reports
// GET: Get client transaction report data
router.get('/reports/client-transaction', reportController.getClientTransactionReport);
// POST: Export client transaction report (CSV, PDF, XLSX)
router.post('/reports/client-transaction/export', reportController.exportClientTransactionReport);

// Custom Report Generation
// POST: Generate custom report with filters
router.post('/reports/generate', reportController.generateCustomReport);
// POST: Export any report type (CSV, PDF, XLSX)
router.post('/reports/export', reportController.exportReport);

// Client Management for Reports
// GET: Get all clients for dropdown filters
router.get('/clients', admin, reportController.getAllClients);
// GET: Get client statistics
router.get('/clients/stats', admin, reportController.getClientStats);

// ============ ADDITIONAL REPORT ROUTES (Optional) ============

// Assessment Statistics
router.get('/stats/assessments', async (req, res) => {
  try {
    const PreAssessment = require('../models/PreAssessment');
    const total = await PreAssessment.countDocuments();
    const completed = await PreAssessment.countDocuments({ assessmentStatus: 'completed' });
    const pending = await PreAssessment.countDocuments({ assessmentStatus: { $in: ['pending_review', 'pending_payment'] } });
    const inProgress = await PreAssessment.countDocuments({ assessmentStatus: { $in: ['scheduled', 'site_visit_ongoing', 'device_deployed', 'data_collecting', 'data_analyzing', 'report_draft'] } });
    
    res.json({
      success: true,
      stats: { total, completed, pending, inProgress }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Project Statistics
router.get('/stats/projects', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const total = await Project.countDocuments();
    const completed = await Project.countDocuments({ status: 'completed' });
    const inProgress = await Project.countDocuments({ status: 'in_progress' });
    const pending = await Project.countDocuments({ status: { $in: ['quoted', 'approved', 'initial_paid', 'full_paid'] } });
    
    res.json({
      success: true,
      stats: { total, completed, inProgress, pending }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Revenue Statistics
router.get('/stats/revenue', async (req, res) => {
  try {
    const PreAssessment = require('../models/PreAssessment');
    const Project = require('../models/Project');
    
    const preRevenue = await PreAssessment.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$assessmentFee' } } }
    ]);
    
    const projectRevenue = await Project.aggregate([
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    
    const totalRevenue = (preRevenue[0]?.total || 0) + (projectRevenue[0]?.total || 0);
    
    res.json({
      success: true,
      stats: {
        preAssessmentRevenue: preRevenue[0]?.total || 0,
        projectRevenue: projectRevenue[0]?.total || 0,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;