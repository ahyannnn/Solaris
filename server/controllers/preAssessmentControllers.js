// controllers/preAssessmentControllers.js
const PreAssessment = require('../models/PreAssessment');
const Client = require('../models/Clients');
const Address = require('../models/Address');
const IoTDevice = require('../models/IoTDevice');
const SensorData = require('../models/SensorData');
const mongoose = require('mongoose');

// @desc    Create a new pre-assessment booking
// @route   POST /api/pre-assessments
// @access  Private (Customer)
// In preAssessmentControllers.js, update the createPreAssessment function
exports.createPreAssessment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clientId, addressId, propertyType, desiredCapacity, roofType, preferredDate } = req.body;

    // Find client
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Verify client ID matches
    if (client._id.toString() !== clientId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Verify address belongs to client
    const address = await Address.findOne({ _id: addressId, clientId: client._id });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Generate references manually (no middleware)
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const bookingReference = `PA-${year}${month}${day}-${random}`;
    const invoiceNumber = `INV-${year}${month}${day}-${random}`;

    const preAssessment = new PreAssessment({
      clientId: client._id,
      addressId,
      propertyType,
      desiredCapacity: desiredCapacity || '',
      roofType: roofType || '',
      preferredDate: new Date(preferredDate),
      paymentStatus: 'pending',
      assessmentStatus: 'pending_payment',
      bookingReference,  // Add generated reference
      invoiceNumber       // Add generated invoice
    });

    await preAssessment.save();

    res.status(201).json({
      success: true,
      message: 'Pre-assessment booked successfully',
      booking: {
        _id: preAssessment._id,
        bookingReference: preAssessment.bookingReference,
        invoiceNumber: preAssessment.invoiceNumber,
        assessmentFee: preAssessment.assessmentFee,
        preferredDate: preAssessment.preferredDate,
        assessmentStatus: preAssessment.assessmentStatus,
        paymentStatus: preAssessment.paymentStatus
      }
    });

  } catch (error) {
    console.error('Create pre-assessment error:', error);
    res.status(500).json({ message: 'Failed to book pre-assessment', error: error.message });
  }
};

// @desc    Submit payment proof (GCash)
// @route   POST /api/pre-assessments/payment
// @access  Private (Customer)
exports.submitPaymentProof = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingReference, paymentMethod, paymentReference } = req.body;
    const paymentProof = req.file ? req.file.path : null;

    if (!paymentProof) {
      return res.status(400).json({ message: 'Payment proof is required' });
    }

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const preAssessment = await PreAssessment.findOne({ 
      bookingReference, 
      clientId: client._id 
    });

    if (!preAssessment) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (preAssessment.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'Payment already submitted' });
    }

    preAssessment.paymentMethod = paymentMethod;
    preAssessment.paymentReference = paymentReference;
    preAssessment.paymentProof = paymentProof;
    preAssessment.paymentStatus = 'for_verification';
    preAssessment.assessmentStatus = 'scheduled';

    await preAssessment.save();

    res.json({
      success: true,
      message: 'Payment proof submitted successfully. Please wait for verification.',
      booking: {
        bookingReference: preAssessment.bookingReference,
        assessmentStatus: preAssessment.assessmentStatus,
        paymentStatus: preAssessment.paymentStatus
      }
    });

  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ message: 'Failed to submit payment', error: error.message });
  }
};

// @desc    Cash payment selection
// @route   POST /api/pre-assessments/cash-payment
// @access  Private (Customer)
exports.cashPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingReference } = req.body;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const preAssessment = await PreAssessment.findOne({ 
      bookingReference, 
      clientId: client._id 
    });

    if (!preAssessment) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    preAssessment.paymentMethod = 'cash';
    preAssessment.paymentStatus = 'pending';
    preAssessment.assessmentStatus = 'scheduled';

    await preAssessment.save();

    res.json({
      success: true,
      message: 'Cash payment selected. Please visit our office to complete payment.',
      booking: {
        bookingReference: preAssessment.bookingReference,
        assessmentStatus: preAssessment.assessmentStatus
      }
    });

  } catch (error) {
    console.error('Cash payment error:', error);
    res.status(500).json({ message: 'Failed to process cash payment', error: error.message });
  }
};

// @desc    Verify payment (Admin only)
// @route   PUT /api/pre-assessments/:id/verify-payment
// @access  Private (Admin)
exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, notes } = req.body;

    const preAssessment = await PreAssessment.findById(id);
    if (!preAssessment) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (verified) {
      preAssessment.paymentStatus = 'paid';
      preAssessment.confirmedAt = new Date();
    } else {
      preAssessment.paymentStatus = 'failed';
      preAssessment.assessmentStatus = 'cancelled';
    }

    preAssessment.adminRemarks = notes;
    await preAssessment.save();

    res.json({
      success: true,
      message: verified ? 'Payment verified successfully' : 'Payment verification failed',
      booking: preAssessment
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};

// @desc    Get all pre-assessments (Admin/Engineer)
// @route   GET /api/pre-assessments
// @access  Private (Admin, Engineer)
exports.getAllPreAssessments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.assessmentStatus = status;

    const assessments = await PreAssessment.find(query)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('addressId')
      .populate('iotDeviceId')
      .populate('assignedEngineerId', 'email firstName lastName')
      .sort({ bookedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PreAssessment.countDocuments(query);

    res.json({
      success: true,
      assessments,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get pre-assessments error:', error);
    res.status(500).json({ message: 'Failed to fetch pre-assessments', error: error.message });
  }
};

// @desc    Get client's pre-assessments
// @route   GET /api/pre-assessments/my-bookings
// @access  Private (Customer)
exports.getMyPreAssessments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const assessments = await PreAssessment.find({ clientId: client._id })
      .populate('addressId')
      .populate('iotDeviceId')
      .sort({ bookedAt: -1 });

    res.json({
      success: true,
      assessments
    });

  } catch (error) {
    console.error('Get my pre-assessments error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
};

// @desc    Get pre-assessment by ID
// @route   GET /api/pre-assessments/:id
// @access  Private
exports.getPreAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const assessment = await PreAssessment.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('addressId')
      .populate('iotDeviceId')
      .populate('assignedEngineerId', 'email firstName lastName')
      .populate('deviceDeployedBy', 'firstName lastName')
      .populate('deviceRetrievedBy', 'firstName lastName');

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Check authorization
    const client = await Client.findOne({ userId });
    if (userRole !== 'admin' && userRole !== 'engineer' && assessment.clientId._id.toString() !== client?._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      success: true,
      assessment
    });

  } catch (error) {
    console.error('Get pre-assessment error:', error);
    res.status(500).json({ message: 'Failed to fetch pre-assessment', error: error.message });
  }
};

// @desc    Assign engineer to pre-assessment (Admin only)
// @route   PUT /api/pre-assessments/:id/assign-engineer
// @access  Private (Admin)
exports.assignEngineer = async (req, res) => {
  try {
    const { id } = req.params;
    const { engineerId, siteVisitDate, notes } = req.body;

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    assessment.assignedEngineerId = engineerId;
    if (siteVisitDate) assessment.siteVisitDate = new Date(siteVisitDate);
    if (notes) assessment.siteVisitNotes = notes;

    await assessment.save();

    res.json({
      success: true,
      message: 'Engineer assigned successfully',
      assessment
    });

  } catch (error) {
    console.error('Assign engineer error:', error);
    res.status(500).json({ message: 'Failed to assign engineer', error: error.message });
  }
};

// @desc    Deploy IoT device (Engineer only)
// @route   POST /api/pre-assessments/:id/deploy-device
// @access  Private (Engineer)
exports.deployDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId, notes } = req.body;
    const engineerId = req.user.id;

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assessmentStatus !== 'scheduled') {
      return res.status(400).json({ message: 'Cannot deploy device at this stage' });
    }

    // Find and deploy device
    const device = await IoTDevice.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.status !== 'available') {
      return res.status(400).json({ message: 'Device is not available' });
    }

    device.status = 'deployed';
    device.currentPreAssessmentId = assessment._id;
    device.lastDeployedAt = new Date();
    device.deployedBy = engineerId;
    await device.save();

    assessment.iotDeviceId = device._id;
    assessment.deviceDeployedAt = new Date();
    assessment.deviceDeployedBy = engineerId;
    assessment.dataCollectionStart = new Date();
    assessment.assessmentStatus = 'device_deployed';
    await assessment.save();

    res.json({
      success: true,
      message: 'Device deployed successfully',
      assessment
    });

  } catch (error) {
    console.error('Deploy device error:', error);
    res.status(500).json({ message: 'Failed to deploy device', error: error.message });
  }
};

// @desc    Retrieve IoT device (Engineer only)
// @route   POST /api/pre-assessments/:id/retrieve-device
// @access  Private (Engineer)
exports.retrieveDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const engineerId = req.user.id;

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assessmentStatus !== 'device_deployed' && assessment.assessmentStatus !== 'data_collecting') {
      return res.status(400).json({ message: 'No device deployed to retrieve' });
    }

    // Retrieve device
    const device = await IoTDevice.findById(assessment.iotDeviceId);
    if (device) {
      device.status = 'available';
      device.currentPreAssessmentId = null;
      device.lastRetrievedAt = new Date();
      await device.save();
    }

    assessment.deviceRetrievedAt = new Date();
    assessment.deviceRetrievedBy = engineerId;
    assessment.dataCollectionEnd = new Date();
    assessment.assessmentStatus = 'data_analyzing';
    await assessment.save();

    res.json({
      success: true,
      message: 'Device retrieved successfully',
      assessment
    });

  } catch (error) {
    console.error('Retrieve device error:', error);
    res.status(500).json({ message: 'Failed to retrieve device', error: error.message });
  }
};

// @desc    Generate report and final quotation (Engineer only)
// @route   POST /api/pre-assessments/:id/generate-report
// @access  Private (Engineer)
exports.generateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      finalSystemSize, 
      finalSystemCost, 
      recommendedSystemType,
      panelsNeeded,
      estimatedAnnualProduction,
      estimatedAnnualSavings,
      paybackPeriod,
      co2Offset,
      engineerRecommendations,
      technicalFindings,
      detailedReport,
      finalQuotation
    } = req.body;

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Update with results
    assessment.finalSystemSize = finalSystemSize;
    assessment.finalSystemCost = finalSystemCost;
    assessment.recommendedSystemType = recommendedSystemType;
    assessment.panelsNeeded = panelsNeeded;
    assessment.estimatedAnnualProduction = estimatedAnnualProduction;
    assessment.estimatedAnnualSavings = estimatedAnnualSavings;
    assessment.paybackPeriod = paybackPeriod;
    assessment.co2Offset = co2Offset;
    assessment.engineerRecommendations = engineerRecommendations;
    assessment.technicalFindings = technicalFindings;
    assessment.detailedReport = detailedReport;
    assessment.finalQuotation = finalQuotation;
    assessment.assessmentStatus = 'completed';
    assessment.completedAt = new Date();

    await assessment.save();

    // Get sensor readings data
    const readings = await SensorData.find({ preAssessmentId: assessment._id })
      .sort({ timestamp: 1 });

    res.json({
      success: true,
      message: 'Report generated successfully',
      assessment,
      readings
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
};

// @desc    Cancel pre-assessment (Customer)
// @route   PUT /api/pre-assessments/:id/cancel
// @access  Private (Customer)
exports.cancelPreAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const assessment = await PreAssessment.findOne({ _id: id, clientId: client._id });
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assessmentStatus !== 'pending_payment') {
      return res.status(400).json({ message: 'Cannot cancel assessment that is already scheduled or in progress' });
    }

    assessment.assessmentStatus = 'cancelled';
    await assessment.save();

    res.json({
      success: true,
      message: 'Pre-assessment cancelled successfully',
      assessment
    });

  } catch (error) {
    console.error('Cancel pre-assessment error:', error);
    res.status(500).json({ message: 'Failed to cancel pre-assessment', error: error.message });
  }
};