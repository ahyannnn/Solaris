const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Project = require('../models/Project');
const PreAssessment = require('../models/PreAssessment');
const Client = require('../models/Clients');
const User = require('../models/Users');

// ============ SHARED HELPERS (server-side paging: 10 per page) ============

const SCHEDULE_PAGE_SIZE = 10;
const SCHEDULE_MAX_LIMIT = 50;

// Assessment statuses that count as report-draft/completed (mirrors frontend enrichment)
const REPORT_LIKE_STATUSES = [
  'report_draft',
  'report_drafted',
  'completed',
  'quoted',
  'quotation_generated'
];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePaging = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(
    SCHEDULE_MAX_LIMIT,
    Math.max(1, parseInt(limit, 10) || SCHEDULE_PAGE_SIZE)
  );
  return { pageNum, limitNum };
};

// Derive the display status from a schedule + its linked assessment.
// Same priority as the old client enrichment: report-draft -> completed,
// device deployed -> device_deployed, else the schedule's own status.
const deriveEnrichedStatus = (scheduleStatus, assessment) => {
  if (!assessment) {
    return {
      status: scheduleStatus,
      isDeployed: false,
      deployedAt: null,
      isReportDraft: false
    };
  }
  const isReportDraft = REPORT_LIKE_STATUSES.includes(assessment.assessmentStatus);
  const isDeployed = !!assessment.deviceDeployedAt;
  return {
    status: isReportDraft ? 'completed' : (isDeployed ? 'device_deployed' : scheduleStatus),
    isDeployed,
    deployedAt: assessment.deviceDeployedAt || null,
    isReportDraft
  };
};

// Attach _enrichedStatus/_isDeviceDeployed/_deviceDeployedAt/_assessmentId/_isReportDraft
// to lean schedule rows. Covers the legacy fallback where the assessment shares
// the schedule's _id (single bounded batch query, max = page size).
const attachAssessmentEnrichment = async (schedules) => {
  const byId = {};
  const missingIds = [];
  schedules.forEach((s) => {
    let assessment = null;
    let assessmentId = null;
    const ref = s.preAssessmentId;
    if (ref && typeof ref === 'object' && ref._id) {
      assessment = ref;
      assessmentId = ref._id.toString();
    } else if (typeof ref === 'string' && ref) {
      assessmentId = ref;
    }
    if (!assessmentId) {
      assessmentId = s._id.toString();
    }
    if (!assessment) missingIds.push(assessmentId);
    byId[assessmentId] = byId[assessmentId] || [];
    byId[assessmentId].push({ row: s, assessment });
  });

  if (missingIds.length) {
    const found = await PreAssessment.find({ _id: { $in: missingIds } })
      .select('assessmentStatus deviceDeployedAt')
      .lean();
    found.forEach((a) => {
      (byId[a._id.toString()] || []).forEach((entry) => {
        if (!entry.assessment) entry.assessment = a;
      });
    });
  }

  Object.entries(byId).forEach(([assessmentId, entries]) => {
    entries.forEach(({ row, assessment }) => {
      const enriched = deriveEnrichedStatus(row.status, assessment);
      row._enrichedStatus = enriched.status;
      row._isDeviceDeployed = enriched.isDeployed;
      row._deviceDeployedAt = enriched.deployedAt;
      row._assessmentId = assessmentId;
      row._isReportDraft = enriched.isReportDraft;
    });
  });
  return schedules;
};

// Build a server-side search filter matching the old client search fields:
// title, clientName, status, _id + projectName/projectReference (Project),
// bookingReference (PreAssessment), engineer names (User).
const buildScheduleSearchFilter = async (search) => {
  const term = (search || '').trim();
  if (!term) return null;
  const rx = new RegExp(escapeRegex(term), 'i');
  const or = [{ title: rx }, { clientName: rx }, { status: rx }];
  if (mongoose.Types.ObjectId.isValid(term)) {
    or.push({ _id: new mongoose.Types.ObjectId(term) });
  }
  const [projects, assessments, users, clients] = await Promise.all([
    Project.find({ $or: [{ projectName: rx }, { projectReference: rx }] }).select('_id').lean(),
    PreAssessment.find({ bookingReference: rx }).select('_id').lean(),
    User.find({ $or: [{ fullName: rx }, { firstName: rx }, { lastName: rx }] }).select('_id').lean(),
    Client.find({ $or: [{ contactFirstName: rx }, { contactLastName: rx }] }).select('_id').lean()
  ]);
  if (projects.length) or.push({ projectId: { $in: projects.map((p) => p._id) } });
  if (assessments.length) or.push({ preAssessmentId: { $in: assessments.map((a) => a._id) } });
  if (users.length) or.push({ assignedEngineerId: { $in: users.map((u) => u._id) } });
  if (clients.length) or.push({ clientId: { $in: clients.map((c) => c._id) } });
  return { $or: or };
};

// ============ ADMIN FUNCTIONS ============

// @desc    Get all schedules (Admin)
// @route   GET /api/schedules
// @access  Private (Admin)
exports.getAllSchedules = async (req, res) => {
  try {
    const { type, status, startDate, endDate, engineerId, search, page = 1, limit = SCHEDULE_PAGE_SIZE, sort } = req.query;
    const { pageNum, limitNum } = parsePaging(page, limit);

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

    const searchFilter = await buildScheduleSearchFilter(search);
    const finalQuery = searchFilter ? { $and: [query, searchFilter] } : query;

    const sortOrder = sort === 'desc' ? -1 : 1;

    const schedules = await Schedule.find(finalQuery)
      .populate({
        path: 'clientId',
        select: 'contactFirstName contactLastName contactNumber userId',
        populate: { path: 'userId', select: 'email photoURL' }
      })
      .populate('assignedEngineerId', 'fullName firstName lastName email photoURL')
      .populate('projectId', 'projectName projectReference')
      .populate('preAssessmentId', 'bookingReference assessmentStatus deviceDeployedAt')
      .sort({ scheduledDate: sortOrder, scheduledTime: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    await attachAssessmentEnrichment(schedules);

    const total = await Schedule.countDocuments(finalQuery);

    res.json({
      success: true,
      schedules,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      itemsPerPage: limitNum
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

    const preAssessment = await computePreAssessmentSection({});

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
        },
        preAssessment
      }
    });

  } catch (error) {
    console.error('Get schedule stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

// Lightweight chart source for the pre-assessment tab (replaces full 10k-row
// client dumps): enriched status distribution + monthly scheduled/completed.
// Uses unpopulated selects only — no heavy documents cross the wire.
const computePreAssessmentSection = async (baseQuery) => {
  const rows = await Schedule.find({ ...baseQuery, type: 'pre_assessment' })
    .select('status scheduledDate preAssessmentId')
    .lean();
  const assessments = await PreAssessment.find({})
    .select('assessmentStatus deviceDeployedAt')
    .lean();
  const assessmentById = {};
  assessments.forEach((a) => { assessmentById[a._id.toString()] = a; });

  const byStatus = {};
  const monthly = Array.from({ length: 12 }, (_, m) => ({ month: m, scheduled: 0, completed: 0 }));

  rows.forEach((s) => {
    let ref = s.preAssessmentId;
    const key = ref ? ref.toString() : s._id.toString();
    const enriched = deriveEnrichedStatus(s.status, assessmentById[key] || null);
    byStatus[enriched.status] = (byStatus[enriched.status] || 0) + 1;
    const d = new Date(s.scheduledDate);
    if (!isNaN(d.getTime())) {
      const m = d.getMonth();
      monthly[m].scheduled += 1;
      if (enriched.status === 'completed') monthly[m].completed += 1;
    }
  });

  return { total: rows.length, byStatus, monthly };
};

// @desc    Get schedule statistics (Engineer, own schedules only)
// @route   GET /api/schedules/engineer/stats
// @access  Private (Engineer)
exports.getEngineerScheduleStats = async (req, res) => {
  try {
    const engineerId = req.user.id;
    const baseQuery = { assignedEngineerId: engineerId };
    const total = await Schedule.countDocuments(baseQuery);
    const upcoming = await Schedule.countDocuments({
      ...baseQuery,
      scheduledDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed', 'pending'] }
    });
    const confirmed = await Schedule.countDocuments({ ...baseQuery, status: 'confirmed' });
    const completed = await Schedule.countDocuments({ ...baseQuery, status: 'completed' });
    const preAssessment = await computePreAssessmentSection(baseQuery);

    res.json({
      success: true,
      stats: { total, upcoming, confirmed, completed, preAssessment }
    });
  } catch (error) {
    console.error('Get engineer schedule stats error:', error);
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
    const { type, status, startDate, endDate, search, page = 1, limit = SCHEDULE_PAGE_SIZE, sort } = req.query;
    const { pageNum, limitNum } = parsePaging(page, limit);

    const query = { assignedEngineerId: engineerId };
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;

    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    const searchFilter = await buildScheduleSearchFilter(search);
    const finalQuery = searchFilter ? { $and: [query, searchFilter] } : query;

    const sortOrder = sort === 'desc' ? -1 : 1;

    const schedules = await Schedule.find(finalQuery)
      .populate({
        path: 'clientId',
        select: 'contactFirstName contactLastName contactNumber userId',
        populate: { path: 'userId', select: 'email photoURL' }
      })
      .populate('projectId', 'projectName projectReference')
      .populate('preAssessmentId', 'bookingReference assessmentStatus deviceDeployedAt')
      .sort({ scheduledDate: sortOrder, scheduledTime: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    await attachAssessmentEnrichment(schedules);

    const total = await Schedule.countDocuments(finalQuery);

    // Separate upcoming and past schedules (current page only)
    const now = new Date();
    const upcoming = schedules.filter(s => new Date(s.scheduledDate) >= now);
    const past = schedules.filter(s => new Date(s.scheduledDate) < now);

    res.json({
      success: true,
      schedules,
      upcoming,
      past,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      itemsPerPage: limitNum
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

    // Fixed schedule: starts at 6:00 AM, ends at 11:00 AM (5 hours duration)
    const startTime = '06:00';
    const endTime = '11:00';
    const duration = 5;

    const schedule = new Schedule({
      preAssessmentId: preAssessment._id,
      type: 'pre_assessment',
      title: `Site Assessment - ${preAssessment.bookingReference}`,
      description: `Initial site assessment for solar installation at ${preAssessment.addressId?.houseOrBuilding}`,
      scheduledDate: new Date(siteVisitDate),
      scheduledTime: startTime,
      duration: duration,
      endTime: endTime,
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