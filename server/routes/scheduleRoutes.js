const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin, engineer } = require('../middleware/roleMiddleware');

const {
  // Admin functions
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleStats,
  getCalendarSchedules,
    createScheduleFromPreAssessment,

  
  // Engineer functions
  getMySchedules,
  updateScheduleStatus,
  requestReschedule,
  getEngineerCalendar
} = require('../controllers/scheduleController');

const { verifyToken } = authMiddleware;

// ============ ADMIN ROUTES ============
router.get('/stats', verifyToken, admin, getScheduleStats);
router.get('/calendar', verifyToken, admin, getCalendarSchedules);
router.get('/', verifyToken, admin, getAllSchedules);
router.get('/:id', verifyToken, admin, getScheduleById);
router.post('/', verifyToken, admin, createSchedule);
router.put('/:id', verifyToken, admin, updateSchedule);
router.delete('/:id', verifyToken, admin, deleteSchedule);
// routes/scheduleRoutes.js - Add these routes

// Admin routes (continued)
router.post('/create-from-preassessment', verifyToken, admin, createScheduleFromPreAssessment);



// ============ ENGINEER ROUTES ============
router.get('/engineer/my-schedules', verifyToken, engineer, getMySchedules);
router.get('/engineer/calendar', verifyToken, engineer, getEngineerCalendar);
router.put('/:id/status', verifyToken, engineer, updateScheduleStatus);
router.post('/:id/reschedule-request', verifyToken, engineer, requestReschedule);

module.exports = router;