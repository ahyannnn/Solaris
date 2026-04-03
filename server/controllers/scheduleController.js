const Schedule = require('../models/Schedule');
const Project = require('../models/Project');
const PreAssessment = require('../models/PreAssessment');
const Client = require('../models/Clients');
const User = require('../models/Users');

// ============ ADMIN FUNCTIONS ============

// @desc    Get all schedules (Admin)
// @route   GET /api/schedules
// @access  Private (Admin)
exports.getAllSchedules = async (req, res) => {
  try {
    const { type, status, startDate, endDate, engineerId, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    if (engineerId) query.assignedEngineerId = engineerId;
    
    // Date range filter
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    const schedules = await Schedule.find(query)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('assignedEngineerId', 'firstName lastName email')
      .populate('projectId', 'projectName projectReference')
      .populate('preAssessmentId', 'bookingReference')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Schedule.countDocuments(query);

    res.json({
      success: true,
      schedules,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get all schedules error:', error);
    res.status(500).json({ message: 'Failed to fetch schedules', error: error.message });
  }
};

// @desc    Get schedule by ID
// @route   GET /api/schedules/:id
// @access  Private (Admin, Engineer)
exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber email')
      .populate('assignedEngineerId', 'firstName lastName email')
      .populate('assignedTeam', 'firstName lastName email')
      .populate('projectId')
      .populate('preAssessmentId');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({
      success: true,
      schedule
    });

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Failed to fetch schedule', error: error.message });
  }
};

// @desc    Create schedule (Admin)
// @route   POST /api/schedules
// @access  Private (Admin)
exports.createSchedule = async (req, res) => {
  try {
    const {
      projectId,
      preAssessmentId,
      type,
      title,
      description,
      scheduledDate,
      scheduledTime,
      duration,
      address,
      assignedEngineerId,
      assignedTeam,
      clientId,
      notes
    } = req.body;

    // Validate required fields
    if (!type || !title || !scheduledDate || !scheduledTime || !clientId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get client details
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Calculate end time
    const endTime = new Date(`${scheduledDate}T${scheduledTime}`);
    endTime.setHours(endTime.getHours() + (duration || 2));
    const endTimeString = endTime.toTimeString().slice(0, 5);

    const schedule = new Schedule({
      projectId,
      preAssessmentId,
      type,
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      duration: duration || 2,
      endTime: endTimeString,
      address,
      assignedEngineerId,
      assignedTeam,
      clientId,
      clientName: `${client.contactFirstName} ${client.contactLastName}`,
      clientPhone: client.contactNumber,
      notes,
      createdBy: req.user.id
    });

    await schedule.save();

    // If this is for a project, update project schedule
    if (projectId) {
      await Project.findByIdAndUpdate(projectId, {
        scheduledInstallationDate: new Date(scheduledDate)
      });
    }

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      schedule
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Failed to create schedule', error: error.message });
  }
};

// @desc    Update schedule (Admin)
// @route   PUT /api/schedules/:id
// @access  Private (Admin)
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      scheduledDate,
      scheduledTime,
      duration,
      address,
      assignedEngineerId,
      assignedTeam,
      notes,
      status
    } = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Calculate new end time if date/time changes
    let endTimeString = schedule.endTime;
    if (scheduledDate && scheduledTime) {
      const endTime = new Date(`${scheduledDate}T${scheduledTime}`);
      endTime.setHours(endTime.getHours() + (duration || schedule.duration));
      endTimeString = endTime.toTimeString().slice(0, 5);
    }

    const updates = {
      scheduledDate: scheduledDate ? new Date(scheduledDate) : schedule.scheduledDate,
      scheduledTime: scheduledTime || schedule.scheduledTime,
      duration: duration || schedule.duration,
      endTime: endTimeString,
      address: address || schedule.address,
      assignedEngineerId: assignedEngineerId || schedule.assignedEngineerId,
      assignedTeam: assignedTeam || schedule.assignedTeam,
      notes: notes || schedule.notes,
      status: status || schedule.status,
      updatedBy: req.user.id,
      updatedAt: new Date()
    };

    Object.assign(schedule, updates);
    await schedule.save();

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      schedule
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Failed to update schedule', error: error.message });
  }
};

// @desc    Delete schedule (Admin)
// @route   DELETE /api/schedules/:id
// @access  Private (Admin)
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    await schedule.deleteOne();

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Failed to delete schedule', error: error.message });
  }
};

// @desc    Get schedule statistics (Admin)
// @route   GET /api/schedules/stats
// @access  Private (Admin)
exports.getScheduleStats = async (req, res) => {
  try {
    const total = await Schedule.countDocuments();
    const scheduled = await Schedule.countDocuments({ status: 'scheduled' });
    const confirmed = await Schedule.countDocuments({ status: 'confirmed' });
    const completed = await Schedule.countDocuments({ status: 'completed' });
    const cancelled = await Schedule.countDocuments({ status: 'cancelled' });
    const rescheduled = await Schedule.countDocuments({ status: 'rescheduled' });

    // Upcoming schedules (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcoming = await Schedule.countDocuments({
      scheduledDate: { $gte: new Date(), $lte: nextWeek },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // Schedules by type
    const preAssessmentSchedules = await Schedule.countDocuments({ type: 'pre_assessment' });
    const siteVisitSchedules = await Schedule.countDocuments({ type: 'site_visit' });
    const installationSchedules = await Schedule.countDocuments({ type: 'installation' });
    const inspectionSchedules = await Schedule.countDocuments({ type: 'inspection' });

    res.json({
      success: true,
      stats: {
        total,
        scheduled,
        confirmed,
        completed,
        cancelled,
        rescheduled,
        upcoming,
        byType: {
          preAssessment: preAssessmentSchedules,
          siteVisit: siteVisitSchedules,
          installation: installationSchedules,
          inspection: inspectionSchedules
        }
      }
    });

  } catch (error) {
    console.error('Get schedule stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

// @desc    Get schedules for calendar view (Admin)
// @route   GET /api/schedules/calendar
// @access  Private (Admin)
exports.getCalendarSchedules = async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const query = {};
    if (start && end) {
      query.scheduledDate = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    const schedules = await Schedule.find(query)
      .populate('clientId', 'contactFirstName contactLastName')
      .populate('assignedEngineerId', 'firstName lastName')
      .select('title type scheduledDate scheduledTime status clientId assignedEngineerId');

    // Format for calendar display
    const calendarEvents = schedules.map(schedule => ({
      id: schedule._id,
      title: schedule.title,
      start: `${schedule.scheduledDate.toISOString().split('T')[0]}T${schedule.scheduledTime}`,
      end: schedule.endTime ? `${schedule.scheduledDate.toISOString().split('T')[0]}T${schedule.endTime}` : null,
      type: schedule.type,
      status: schedule.status,
      clientName: schedule.clientId ? `${schedule.clientId.contactFirstName} ${schedule.clientId.contactLastName}` : 'N/A',
      engineerName: schedule.assignedEngineerId ? `${schedule.assignedEngineerId.firstName} ${schedule.assignedEngineerId.lastName}` : 'Unassigned',
      backgroundColor: schedule.type === 'pre_assessment' ? '#3498db' :
                       schedule.type === 'site_visit' ? '#2ecc71' :
                       schedule.type === 'installation' ? '#e67e22' : '#9b59b6',
      borderColor: schedule.status === 'cancelled' ? '#e74c3c' : undefined
    }));

    res.json({
      success: true,
      events: calendarEvents
    });

  } catch (error) {
    console.error('Get calendar schedules error:', error);
    res.status(500).json({ message: 'Failed to fetch calendar', error: error.message });
  }
};

// ============ ENGINEER FUNCTIONS ============

// @desc    Get engineer's schedules
// @route   GET /api/schedules/engineer/my-schedules
// @access  Private (Engineer)
exports.getMySchedules = async (req, res) => {
  try {
    const engineerId = req.user.id;
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = { assignedEngineerId: engineerId };
    if (status && status !== 'all') query.status = status;
    
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    const schedules = await Schedule.find(query)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('projectId', 'projectName projectReference')
      .populate('preAssessmentId', 'bookingReference')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Schedule.countDocuments(query);

    // Separate upcoming and past schedules
    const now = new Date();
    const upcoming = schedules.filter(s => new Date(s.scheduledDate) >= now);
    const past = schedules.filter(s => new Date(s.scheduledDate) < now);

    res.json({
      success: true,
      schedules,
      upcoming,
      past,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get my schedules error:', error);
    res.status(500).json({ message: 'Failed to fetch schedules', error: error.message });
  }
};

// @desc    Update schedule status (Engineer)
// @route   PUT /api/schedules/:id/status
// @access  Private (Engineer)
exports.updateScheduleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const engineerId = req.user.id;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if engineer is assigned
    if (schedule.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized to update this schedule' });
    }

    // Update status based on action
    if (status === 'in_progress') {
      await schedule.confirm(engineerId);
    } else if (status === 'completed') {
      await schedule.complete(engineerId, notes);
    } else if (status === 'cancelled') {
      await schedule.cancel(engineerId, notes);
    }

    res.json({
      success: true,
      message: `Schedule marked as ${status}`,
      schedule
    });

  } catch (error) {
    console.error('Update schedule status error:', error);
    res.status(500).json({ message: 'Failed to update schedule', error: error.message });
  }
};

// @desc    Request schedule reschedule (Engineer)
// @route   POST /api/schedules/:id/reschedule-request
// @access  Private (Engineer)
exports.requestReschedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, reason } = req.body;
    const engineerId = req.user.id;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    if (schedule.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create reschedule request (status remains, admin will approve)
    schedule.rescheduleHistory.push({
      oldDate: schedule.scheduledDate,
      newDate: new Date(newDate),
      reason: reason,
      requestedBy: engineerId,
      requestedAt: new Date()
    });
    schedule.rescheduleReason = reason;
    await schedule.save();

    // Notify admin (you can add email notification here)

    res.json({
      success: true,
      message: 'Reschedule request sent to admin',
      schedule
    });

  } catch (error) {
    console.error('Request reschedule error:', error);
    res.status(500).json({ message: 'Failed to request reschedule', error: error.message });
  }
};

// @desc    Get engineer's schedule for calendar view
// @route   GET /api/schedules/engineer/calendar
// @access  Private (Engineer)
exports.getEngineerCalendar = async (req, res) => {
  try {
    const engineerId = req.user.id;
    const { start, end } = req.query;
    
    const query = { assignedEngineerId: engineerId };
    if (start && end) {
      query.scheduledDate = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    const schedules = await Schedule.find(query)
      .populate('clientId', 'contactFirstName contactLastName')
      .select('title type scheduledDate scheduledTime status clientId address');

    const calendarEvents = schedules.map(schedule => ({
      id: schedule._id,
      title: schedule.title,
      start: `${schedule.scheduledDate.toISOString().split('T')[0]}T${schedule.scheduledTime}`,
      type: schedule.type,
      status: schedule.status,
      clientName: schedule.clientId ? `${schedule.clientId.contactFirstName} ${schedule.clientId.contactLastName}` : 'N/A',
      address: schedule.address,
      backgroundColor: schedule.type === 'pre_assessment' ? '#3498db' :
                       schedule.type === 'site_visit' ? '#2ecc71' :
                       schedule.type === 'installation' ? '#e67e22' : '#9b59b6'
    }));

    res.json({
      success: true,
      events: calendarEvents
    });

  } catch (error) {
    console.error('Get engineer calendar error:', error);
    res.status(500).json({ message: 'Failed to fetch calendar', error: error.message });
  }
};
// controllers/scheduleController.js - Add this function

// @desc    Auto-create schedule from pre-assessment approval
// @route   POST /api/schedules/create-from-preassessment
// @access  Private (Admin)
exports.createScheduleFromPreAssessment = async (req, res) => {
  try {
    const { preAssessmentId, engineerId, siteVisitDate, siteVisitTime } = req.body;
    const adminId = req.user.id;

    const preAssessment = await PreAssessment.findById(preAssessmentId)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('addressId');

    if (!preAssessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Check if schedule already exists
    const existingSchedule = await Schedule.findOne({ preAssessmentId });
    if (existingSchedule) {
      return res.status(400).json({ message: 'Schedule already exists for this assessment' });
    }

    // Calculate end time (default 2 hours duration)
    const duration = 2;
    const endTime = new Date(`${siteVisitDate}T${siteVisitTime || '09:00'}`);
    endTime.setHours(endTime.getHours() + duration);
    const endTimeString = endTime.toTimeString().slice(0, 5);

    const schedule = new Schedule({
      preAssessmentId: preAssessment._id,
      type: 'pre_assessment',
      title: `Site Assessment - ${preAssessment.bookingReference}`,
      description: `Initial site assessment for solar installation at ${preAssessment.addressId?.houseOrBuilding}`,
      scheduledDate: new Date(siteVisitDate),
      scheduledTime: siteVisitTime || '09:00',
      duration: duration,
      endTime: endTimeString,
      address: {
        houseOrBuilding: preAssessment.addressId?.houseOrBuilding,
        street: preAssessment.addressId?.street,
        barangay: preAssessment.addressId?.barangay,
        cityMunicipality: preAssessment.addressId?.cityMunicipality,
        province: preAssessment.addressId?.province,
        zipCode: preAssessment.addressId?.zipCode
      },
      assignedEngineerId: engineerId,
      clientId: preAssessment.clientId._id,
      clientName: `${preAssessment.clientId.contactFirstName} ${preAssessment.clientId.contactLastName}`,
      clientPhone: preAssessment.clientId.contactNumber,
      status: 'scheduled',
      createdBy: adminId
    });

    await schedule.save();

    // Update pre-assessment with schedule info
    preAssessment.siteVisitDate = new Date(siteVisitDate);
    await preAssessment.save();

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      schedule
    });

  } catch (error) {
    console.error('Create schedule from pre-assessment error:', error);
    res.status(500).json({ message: 'Failed to create schedule', error: error.message });
  }
};