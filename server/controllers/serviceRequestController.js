// controllers/serviceRequestController.js
// Simple additional-services booking: customer avails, admin views + contacts.
const ServiceRequest = require('../models/ServiceRequest');
const Client = require('../models/Clients');
const User = require('../models/Users');
const AuditLog = require('../models/AuditLog');
const { sendNotification, sendAdminBroadcast } = require('../utils/notificationHelper');

const SERVICE_TYPES = require('../models/ServiceRequest').SERVICE_TYPES
  || [
    'Electrical Design and Wiring',
    'CCTV Installation',
    'Broadcast system integration',
    'Lighting system design and integration',
    'Solar Installation Course with hands on training',
    'Maintenance'
  ];

const VALID_TRANSITIONS = {
  pending: ['contacted', 'scheduled', 'cancelled'],
  contacted: ['scheduled', 'completed', 'cancelled'],
  scheduled: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

function generateReference() {
  const d = new Date();
  const ymd = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SR-${ymd}-${rand}`;
}

// @desc    Create a service request (Customer)
// @route   POST /api/service-requests
// @access  Private (Customer)
exports.createServiceRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    // Personal info is read-only on the client and derived from the account.
    // Any submitted fullName/email/phone is ignored (source of truth = DB).
    const { serviceType, preferredDate, serviceAddress, notes } = req.body;

    const serviceTypeTrimmed = typeof serviceType === 'string' ? serviceType.trim() : serviceType;
    const addressTrimmed = typeof serviceAddress === 'string' ? serviceAddress.trim() : '';
    const notesTrimmed = typeof notes === 'string' ? notes.trim() : '';

    // Strict no-null validation
    if (!serviceTypeTrimmed) {
      return res.status(400).json({ success: false, message: 'Service type is required.' });
    }
    if (!SERVICE_TYPES.includes(serviceTypeTrimmed)) {
      return res.status(400).json({ success: false, message: 'Invalid service type.' });
    }
    if (!addressTrimmed) {
      return res.status(400).json({ success: false, message: 'Service address is required.' });
    }
    if (addressTrimmed.length < 8) {
      return res.status(400).json({ success: false, message: 'Service address looks too short. Please enter the full address.' });
    }
    if (notesTrimmed.length > 1000) {
      return res.status(400).json({ success: false, message: 'Notes must be 1000 characters or less.' });
    }
    if (!preferredDate) {
      return res.status(400).json({ success: false, message: 'Preferred date is required.' });
    }
    const parsedDate = new Date(preferredDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Preferred date is invalid.' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOnly = new Date(parsedDate);
    dayOnly.setHours(0, 0, 0, 0);
    if (dayOnly < today) {
      return res.status(400).json({ success: false, message: 'Preferred date cannot be in the past.' });
    }

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Derive personal info from account (read-only on client)
    const accountUser = await User.findById(userId).select('email').lean();
    const derivedName = [client.contactFirstName, client.contactMiddleName, client.contactLastName]
      .filter(Boolean).join(' ').trim();
    const derivedEmail = (accountUser?.email || '').trim();
    const derivedPhone = (client.contactNumber || '').trim();

    if (!derivedName || !derivedEmail || !derivedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Your account profile is incomplete (name, email, phone required). Please complete your profile first.'
      });
    }

    // One active request per service: block new if pending/contacted/scheduled exists.
    // New booking allowed only after completed or cancelled.
    const activeExisting = await ServiceRequest.findOne({
      clientId: client._id,
      serviceType: serviceTypeTrimmed,
      status: { $in: ['pending', 'contacted', 'scheduled'] }
    }).select('_id referenceNo status serviceType').lean();

    if (activeExisting) {
      return res.status(409).json({
        success: false,
        message: `You already have an active request for "${serviceTypeTrimmed}" (${activeExisting.referenceNo} – ${activeExisting.status}). You can submit again after it is completed or cancelled.`,
        activeRequest: activeExisting
      });
    }

    const request = new ServiceRequest({
      clientId: client._id,
      userId,
      referenceNo: generateReference(),
      fullName: derivedName,
      email: derivedEmail,
      phone: derivedPhone,
      serviceType: serviceTypeTrimmed,
      preferredDate: parsedDate,
      serviceAddress: addressTrimmed,
      notes: notesTrimmed,
      status: 'pending'
    });

    await request.save();

    // Notify customer
    try {
      await sendNotification(
        userId,
        'Service Request Received',
        `Your request ${request.referenceNo} for "${serviceTypeTrimmed}" was received. Our team will contact you soon.`,
        'success',
        '/app/customer/support?tab=services',
        { metadata: { referenceNo: request.referenceNo, serviceType: serviceTypeTrimmed } }
      );
    } catch (e) { console.error('ServiceRequest customer notify failed:', e.message); }

    // Notify all admins
    try {
      await sendAdminBroadcast(
        'New Service Request',
        `${derivedName} requested "${serviceTypeTrimmed}" (${request.referenceNo}). Contact: ${derivedPhone}.`,
        'info',
        '/app/admin/services',
        {
          referenceNo: request.referenceNo,
          serviceType: serviceTypeTrimmed,
          clientName: derivedName,
          clientId: client._id,
          phone: derivedPhone,
          email: derivedEmail,
          status: 'pending',
          timestamp: new Date().toISOString()
        }
      );
    } catch (e) { console.error('ServiceRequest admin broadcast failed:', e.message); }

    return res.status(201).json({ success: true, message: 'Service request submitted successfully', request });
  } catch (error) {
    console.error('Create service request error:', error);
    // Duplicate reference retry once
    if (error.code === 11000) {
      return res.status(500).json({ success: false, message: 'Please try submitting again.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to submit service request', error: error.message });
  }
};

// @desc    Get my service requests (Customer)
// @route   GET /api/service-requests/my-requests
// @access  Private (Customer)
exports.getMyServiceRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    const requests = await ServiceRequest.find({ clientId: client._id }).sort({ createdAt: -1 });
    return res.json({ success: true, requests });
  } catch (error) {
    console.error('Get my service requests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch requests', error: error.message });
  }
};

// @desc    Get all service requests (Admin)
// @route   GET /api/service-requests
// @access  Private (Admin)
exports.getAllServiceRequests = async (req, res) => {
  try {
    const { status, serviceType, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;

    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [requests, total] = await Promise.all([
      ServiceRequest.find(query)
        .populate('clientId', 'contactFirstName contactLastName contactNumber')
        .populate({ path: 'clientId', populate: { path: 'userId', select: 'email photoURL' } })
        .sort({ createdAt: -1 })
        .skip((pg - 1) * lim)
        .limit(lim),
      ServiceRequest.countDocuments(query)
    ]);

    return res.json({ success: true, requests, total, page: pg, totalPages: Math.ceil(total / lim) });
  } catch (error) {
    console.error('Get all service requests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch requests', error: error.message });
  }
};

// @desc    Get service request by ID (Admin, or owner customer)
// @route   GET /api/service-requests/:id
// @access  Private
exports.getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ServiceRequest.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate({ path: 'clientId', populate: { path: 'userId', select: 'email' } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    if (req.user.role === 'admin') {
      return res.json({ success: true, request });
    }

    const client = await Client.findOne({ userId: req.user.id });
    if (client && request.clientId._id.toString() === client._id.toString()) {
      return res.json({ success: true, request });
    }
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  } catch (error) {
    console.error('Get service request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch request', error: error.message });
  }
};

// @desc    Update service request status (Admin)
// @route   PUT /api/service-requests/:id/status
// @access  Private (Admin)
exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    if (!status || !Object.keys(VALID_TRANSITIONS).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    const allowed = VALID_TRANSITIONS[request.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${request.status} to ${status}`
      });
    }

    const oldStatus = request.status;
    request.status = status;
    if (typeof adminRemarks === 'string') request.adminRemarks = adminRemarks;
    if (['contacted', 'scheduled'].includes(status)) {
      request.contactedBy = req.user.id;
      request.contactedAt = request.contactedAt || new Date();
    }
    if (status === 'completed') request.completedAt = new Date();
    await request.save();

    try {
      await AuditLog.create({
        user: req.user.id,
        role: req.user.role,
        module: 'Services',
        action: `Service request ${request.referenceNo} status updated from ${oldStatus} to ${status}`
      });
    } catch (e) { console.error('ServiceRequest audit failed:', e.message); }

    try {
      await sendNotification(
        request.userId,
        'Service Request Update',
        `Your request ${request.referenceNo} for "${request.serviceType}" is now: ${status}.`,
        status === 'cancelled' ? 'error' : 'info',
        '/app/customer/support?tab=services',
        { metadata: { referenceNo: request.referenceNo, status, adminRemarks: request.adminRemarks || '' } }
      );
    } catch (e) { console.error('ServiceRequest status notify failed:', e.message); }

    return res.json({ success: true, message: 'Status updated successfully', request });
  } catch (error) {
    console.error('Update service request status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// @desc    Cancel own pending request (Customer)
// @route   PUT /api/service-requests/:id/cancel
// @access  Private (Customer)
exports.cancelServiceRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    const request = await ServiceRequest.findOne({ _id: req.params.id, clientId: client._id });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled.' });
    }
    request.status = 'cancelled';
    await request.save();

    try {
      await sendNotification(
        userId,
        'Service Request Cancelled',
        `Your request ${request.referenceNo} has been cancelled.`,
        'error',
        '/app/customer/support?tab=services',
        { metadata: { referenceNo: request.referenceNo } }
      );
    } catch (e) { /* ignore */ }

    return res.json({ success: true, message: 'Request cancelled successfully', request });
  } catch (error) {
    console.error('Cancel service request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel request', error: error.message });
  }
};

exports.SERVICE_TYPES = SERVICE_TYPES;
