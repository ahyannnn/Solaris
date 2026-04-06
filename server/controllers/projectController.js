// controllers/projectController.js
const Project = require('../models/Project');
const Client = require('../models/Clients');
const FreeQuote = require('../models/FreeQuote');
const PreAssessment = require('../models/PreAssessment');
const User = require('../models/Users');
const mongoose = require('mongoose');

// Helper function to format currency (for internal use)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// ============ CUSTOMER FUNCTIONS ============

// @desc    Get client's projects
// @route   GET /api/projects/my-projects
// @access  Private (Customer)
exports.getMyProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const projects = await Project.find({ clientId: client._id })
      .populate('assignedEngineerId', 'firstName lastName email')
      .populate('preAssessmentId')
      .populate('addressId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects
    });

  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

// @desc    Create project from accepted quotation (when customer accepts)
// @route   POST /api/projects/accept
// @access  Private (Customer)
exports.createProjectFromAcceptance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sourceType, sourceId, paymentPreference } = req.body;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    let sourceData;
    let projectData = {};

    const generateProjectReference = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `PROJ-${year}${month}-${random}`;
    };

    if (sourceType === 'free-quote') {
      sourceData = await FreeQuote.findById(sourceId).populate('addressId');
      if (!sourceData || sourceData.clientId.toString() !== client._id.toString()) {
        return res.status(404).json({ message: 'Free quote not found' });
      }
      
      projectData = {
        projectReference: generateProjectReference(),
        clientId: client._id,
        userId: client.userId,
        addressId: sourceData.addressId?._id,
        systemSize: parseFloat(sourceData.desiredCapacity) || 5,
        systemType: 'grid-tie',
        totalCost: 0,
        status: 'quoted',
        projectName: `${client.contactFirstName} ${client.contactLastName} - Solar Installation`,
        sourceType: 'free-quote',
        sourceId: sourceData._id,
        paymentPreference: paymentPreference || 'installment',
        fullPaymentCompleted: false
      };
    } else if (sourceType === 'pre-assessment') {
      sourceData = await PreAssessment.findById(sourceId).populate('addressId');
      if (!sourceData || sourceData.clientId.toString() !== client._id.toString()) {
        return res.status(404).json({ message: 'Pre-assessment not found' });
      }
      
      const systemDetails = sourceData.quotation?.systemDetails || {};
      const totalCost = systemDetails.totalCost || sourceData.finalSystemCost || 0;
      
      const parseSafeNumber = (value) => {
        if (!value) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };
      
      // Calculate payment schedule based on preference
      let paymentSchedule = [];
      
      console.log('Payment preference received:', paymentPreference);
      
      if (paymentPreference === 'full') {
        // For full payment, create a single payment entry
        paymentSchedule.push({
          type: 'full',
          amount: totalCost,
          dueDate: new Date(),
          status: 'pending'
        });
      } else {
        // Installment payments (default)
        if (totalCost > 0) {
          paymentSchedule.push({
            type: 'initial',
            amount: totalCost * 0.3,
            dueDate: new Date(),
            status: 'pending'
          });
          paymentSchedule.push({
            type: 'progress',
            amount: totalCost * 0.4,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'pending'
          });
          paymentSchedule.push({
            type: 'final',
            amount: totalCost * 0.3,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: 'pending'
          });
        }
      }
      
      projectData = {
        projectReference: generateProjectReference(),
        clientId: client._id,
        userId: client.userId,
        addressId: sourceData.addressId?._id,
        preAssessmentId: sourceData._id,
        systemSize: parseSafeNumber(systemDetails.systemSize) || parseSafeNumber(sourceData.desiredCapacity) || 5,
        systemType: systemDetails.systemType || sourceData.recommendedSystemType || sourceData.systemType || 'grid-tie',
        panelsNeeded: parseSafeNumber(systemDetails.panelsNeeded) || sourceData.panelsNeeded || null,
        inverterType: systemDetails.inverterType || null,
        batteryType: systemDetails.batteryType || null,
        totalCost: totalCost,
        initialPayment: paymentPreference === 'installment' ? totalCost * 0.3 : 0,
        progressPayment: paymentPreference === 'installment' ? totalCost * 0.4 : 0,
        finalPayment: paymentPreference === 'installment' ? totalCost * 0.3 : 0,
        amountPaid: 0,
        balance: totalCost,
        paymentSchedule: paymentSchedule,
        quotationFile: sourceData.finalQuotation || sourceData.quotation?.quotationUrl,
        status: paymentPreference === 'full' ? 'approved' : 'quoted',
        projectName: `${client.contactFirstName} ${client.contactLastName} - Solar Installation`,
        sourceType: 'pre-assessment',
        sourceId: sourceData._id,
        paymentPreference: paymentPreference || 'installment',
        fullPaymentCompleted: false
      };
      
      console.log('Created project with paymentPreference:', projectData.paymentPreference);
    } else {
      return res.status(400).json({ message: 'Invalid source type' });
    }

    // Remove any undefined or NaN values
    Object.keys(projectData).forEach(key => {
      if (projectData[key] === undefined || (typeof projectData[key] === 'number' && isNaN(projectData[key]))) {
        delete projectData[key];
      }
    });

    const project = new Project(projectData);
    await project.save();

    // Update the source to mark as accepted
    if (sourceType === 'free-quote') {
      sourceData.status = 'accepted';
      await sourceData.save();
    } else if (sourceType === 'pre-assessment') {
      if (sourceData.assessmentStatus) {
        sourceData.assessmentStatus = 'quotation_accepted';
        await sourceData.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });

  } catch (error) {
    console.error('Create project from acceptance error:', error);
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};

// @desc    Record payment on project (Customer)
// @route   POST /api/projects/:id/payments
// @access  Private (Customer)
exports.recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentType, paymentReference, paymentProof } = req.body;
    const userId = req.user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const client = await Client.findOne({ userId });
    if (!client || project.clientId.toString() !== client._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await project.recordPayment(amount, paymentType, null, paymentProof, paymentReference);

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      project: {
        id: project._id,
        amountPaid: project.amountPaid,
        balance: project.balance,
        status: project.status
      }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
};

// ============ ENGINEER FUNCTIONS ============

// @desc    Get engineer's assigned projects
// @route   GET /api/projects/engineer/my-projects
// @access  Private (Engineer)
exports.getEngineerProjects = async (req, res) => {
  try {
    const engineerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { assignedEngineerId: engineerId };
    if (status && status !== 'all') query.status = status;

    const projects = await Project.find(query)
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId.email')
      .populate('addressId')
      .populate('assignedEngineerId', 'firstName lastName email')
      .populate('preAssessmentId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      projects,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get engineer projects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

// @desc    Update project progress (Engineer)
// @route   PUT /api/projects/:id/progress
// @access  Private (Engineer)
exports.updateProjectProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { installationNotes, status, sitePhotos } = req.body;
    const engineerId = req.user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    // Validate status transition
    const validTransitions = {
      'approved': ['in_progress'],
      'initial_paid': ['in_progress'],
      'in_progress': ['progress_paid', 'completed'],
      'progress_paid': ['completed']
    };
    
    if (status && validTransitions[project.status] && !validTransitions[project.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${project.status} to ${status}` 
      });
    }

    if (installationNotes) project.installationNotes = installationNotes;
    if (sitePhotos) project.sitePhotos = [...(project.sitePhotos || []), ...sitePhotos];
    if (status) {
      const oldStatus = project.status;
      project.status = status;
      
      project.projectUpdates = project.projectUpdates || [];
      project.projectUpdates.push({
        title: `Progress Updated: ${oldStatus} → ${status}`,
        description: installationNotes || `Project status changed to ${status}`,
        status: status,
        updatedBy: engineerId
      });
      
      if (status === 'in_progress' && !project.startDate) {
        project.startDate = new Date();
      }
      
      if (status === 'completed') {
        project.actualCompletionDate = new Date();
      }
    }

    await project.save();

    res.json({
      success: true,
      message: 'Project progress updated successfully',
      project
    });

  } catch (error) {
    console.error('Update project progress error:', error);
    res.status(500).json({ message: 'Failed to update progress', error: error.message });
  }
};

// @desc    Upload project photos (Engineer)
// @route   POST /api/projects/:id/upload-photos
// @access  Private (Engineer)
exports.uploadProjectPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
    const files = req.files;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Process file uploads (implement with your file storage service)
    const photoUrls = [];
    for (const file of files) {
      // TODO: Upload to Cloudinary or local storage
      // For now, just store the original name as placeholder
      photoUrls.push(file.path || `/uploads/projects/${file.filename}`);
    }

    project.sitePhotos = [...(project.sitePhotos || []), ...photoUrls];
    await project.save();

    res.json({
      success: true,
      message: 'Photos uploaded successfully',
      photos: photoUrls
    });

  } catch (error) {
    console.error('Upload photos error:', error);
    res.status(500).json({ message: 'Failed to upload photos', error: error.message });
  }
};

// ============ ADMIN FUNCTIONS ============

// @desc    Get all projects (Admin)
// @route   GET /api/projects
// @access  Private (Admin)
exports.getAllProjects = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;

    const projects = await Project.find(query)
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId.email')
      .populate('addressId')
      .populate('assignedEngineerId', 'firstName lastName email')
      .populate('preAssessmentId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      projects,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

// @desc    Update project status (Admin)
// @route   PUT /api/projects/:id/status
// @access  Private (Admin)
exports.updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Validate status transition
    const validTransitions = {
      'quoted': ['approved', 'cancelled'],
      'approved': ['initial_paid', 'cancelled'],
      'initial_paid': ['in_progress', 'cancelled'],
      'in_progress': ['progress_paid', 'completed', 'cancelled'],
      'progress_paid': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (validTransitions[project.status] && !validTransitions[project.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${project.status} to ${status}` 
      });
    }

    const oldStatus = project.status;
    project.status = status;
    
    if (status === 'approved') {
      project.approvedAt = new Date();
      project.approvedBy = adminId;
    }
    
    if (status === 'completed') {
      project.actualCompletionDate = new Date();
    }

    project.projectUpdates = project.projectUpdates || [];
    project.projectUpdates.push({
      title: `Status Updated: ${oldStatus} → ${status}`,
      description: notes || `Project status changed to ${status}`,
      status: status,
      updatedBy: adminId
    });

    await project.save();

    res.json({
      success: true,
      message: `Project status updated to ${status}`,
      project
    });

  } catch (error) {
    console.error('Update project status error:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// @desc    Assign engineer to project (Admin)
// @route   PUT /api/projects/:id/assign-engineer
// @access  Private (Admin)
exports.assignEngineerToProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { engineerId, notes } = req.body;
    const adminId = req.user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const engineer = await User.findById(engineerId);
    if (!engineer || engineer.role !== 'engineer') {
      return res.status(400).json({ message: 'Invalid engineer selected' });
    }

    project.assignedEngineerId = engineerId;
    if (notes) project.internalNotes = notes;
    
    project.projectUpdates = project.projectUpdates || [];
    project.projectUpdates.push({
      title: 'Engineer Assigned',
      description: `Engineer ${engineer.firstName} ${engineer.lastName} assigned to project`,
      status: project.status,
      updatedBy: adminId
    });

    await project.save();

    res.json({
      success: true,
      message: 'Engineer assigned successfully',
      project
    });

  } catch (error) {
    console.error('Assign engineer error:', error);
    res.status(500).json({ message: 'Failed to assign engineer', error: error.message });
  }
};

// @desc    Record payment for project (Admin)
// @route   POST /api/projects/:id/payments
// @access  Private (Admin)
exports.recordProjectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentType, paymentReference } = req.body;
    const adminId = req.user.id;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Update payment schedule
    const scheduleItem = project.paymentSchedule.find(p => p.type === paymentType);
    if (scheduleItem) {
      scheduleItem.status = 'paid';
      scheduleItem.paidAt = new Date();
      scheduleItem.paymentReference = paymentReference;
    }

    // Update amount paid
    project.amountPaid += amount;
    project.balance = project.totalCost - project.amountPaid;

    // Update project status based on payment
    if (paymentType === 'initial' && project.status === 'approved') {
      project.status = 'initial_paid';
    } else if (paymentType === 'progress' && project.status === 'in_progress') {
      project.status = 'progress_paid';
    } else if (paymentType === 'final') {
      if (project.amountPaid >= project.totalCost) {
        project.status = 'completed';
        project.actualCompletionDate = new Date();
      }
    }

    project.projectUpdates = project.projectUpdates || [];
    project.projectUpdates.push({
      title: 'Payment Received',
      description: `Payment of ${formatCurrency(amount)} received for ${paymentType} payment`,
      status: project.status,
      updatedBy: adminId
    });

    await project.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      project: {
        id: project._id,
        amountPaid: project.amountPaid,
        balance: project.balance,
        status: project.status
      }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
};

// @desc    Get project statistics for admin dashboard
// @route   GET /api/projects/stats
// @access  Private (Admin)
exports.getProjectStats = async (req, res) => {
  try {
    const total = await Project.countDocuments();
    const quoted = await Project.countDocuments({ status: 'quoted' });
    const approved = await Project.countDocuments({ status: 'approved' });
    const initialPaid = await Project.countDocuments({ status: 'initial_paid' });
    const inProgress = await Project.countDocuments({ status: 'in_progress' });
    const progressPaid = await Project.countDocuments({ status: 'progress_paid' });
    const completed = await Project.countDocuments({ status: 'completed' });
    const cancelled = await Project.countDocuments({ status: 'cancelled' });

    const revenueResult = await Project.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Get projects by source type
    const fromPreAssessment = await Project.countDocuments({ sourceType: 'pre-assessment' });
    const fromFreeQuote = await Project.countDocuments({ sourceType: 'free-quote' });
    const fromAdmin = await Project.countDocuments({ sourceType: 'admin' });

    // Monthly stats for chart
    const monthlyStats = await Project.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalCost' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        quoted,
        approved,
        initialPaid,
        inProgress,
        progressPaid,
        completed,
        cancelled,
        totalRevenue,
        sources: {
          preAssessment: fromPreAssessment,
          freeQuote: fromFreeQuote,
          admin: fromAdmin
        },
        monthlyStats
      }
    });

  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const project = await Project.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber email')
      .populate('assignedEngineerId', 'firstName lastName email')
      .populate('preAssessmentId')
      .populate('addressId');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization
    const client = await Client.findOne({ userId });
    if (userRole !== 'admin' && userRole !== 'engineer' && 
        project.clientId._id.toString() !== client?._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Failed to fetch project', error: error.message });
  }
};

// @desc    Create new project (Admin)
// @route   POST /api/projects
// @access  Private (Admin)
exports.createProject = async (req, res) => {
  try {
    const { 
      clientId,
      userId,
      addressId,
      systemSize,
      systemType,
      totalCost,
      initialPayment,
      progressPayment,
      finalPayment,
      notes
    } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const generateProjectReference = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `PROJ-${year}${month}-${random}`;
    };

    const projectName = `${client.contactFirstName} ${client.contactLastName} - Solar Installation`;

    const paymentSchedule = [];
    if (initialPayment > 0) {
      paymentSchedule.push({
        type: 'initial',
        amount: initialPayment,
        dueDate: new Date(),
        status: 'pending'
      });
    }
    if (progressPayment > 0) {
      paymentSchedule.push({
        type: 'progress',
        amount: progressPayment,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'pending'
      });
    }
    if (finalPayment > 0) {
      paymentSchedule.push({
        type: 'final',
        amount: finalPayment,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: 'pending'
      });
    }

    const project = new Project({
      projectReference: generateProjectReference(),
      clientId,
      userId,
      addressId,
      projectName,
      systemSize,
      systemType: systemType || 'grid-tie',
      totalCost,
      initialPayment: initialPayment || 0,
      progressPayment: progressPayment || 0,
      finalPayment: finalPayment || 0,
      paymentSchedule,
      status: 'quoted',
      notes,
      createdBy: req.user.id,
      sourceType: 'admin'
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};
// controllers/projectController.js - Updated createProjectFromAcceptance function

exports.createProjectFromAcceptance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sourceType, sourceId, paymentPreference } = req.body;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    let sourceData;
    let projectData = {};

    const generateProjectReference = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `PROJ-${year}${month}-${random}`;
    };

    if (sourceType === 'pre-assessment') {
      sourceData = await PreAssessment.findById(sourceId).populate('addressId');
      if (!sourceData || sourceData.clientId.toString() !== client._id.toString()) {
        return res.status(404).json({ message: 'Pre-assessment not found' });
      }
      
      const systemDetails = sourceData.quotation?.systemDetails || {};
      const totalCost = systemDetails.totalCost || sourceData.finalSystemCost || 0;
      
      const parseSafeNumber = (value) => {
        if (!value) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };
      
      // Calculate payment schedule based on preference
      let paymentSchedule = [];
      
      if (paymentPreference === 'full') {
        // For full payment, create a single payment entry
        paymentSchedule.push({
          type: 'full',
          amount: totalCost,
          dueDate: new Date(),
          status: 'pending'
        });
      } else {
        // Installment payments
        if (totalCost > 0) {
          paymentSchedule.push({
            type: 'initial',
            amount: totalCost * 0.3,
            dueDate: new Date(),
            status: 'pending'
          });
          paymentSchedule.push({
            type: 'progress',
            amount: totalCost * 0.4,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'pending'
          });
          paymentSchedule.push({
            type: 'final',
            amount: totalCost * 0.3,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: 'pending'
          });
        }
      }
      
      projectData = {
        projectReference: generateProjectReference(),
        clientId: client._id,
        userId: client.userId,
        addressId: sourceData.addressId?._id,
        preAssessmentId: sourceData._id,
        systemSize: parseSafeNumber(systemDetails.systemSize) || parseSafeNumber(sourceData.desiredCapacity) || 5,
        systemType: systemDetails.systemType || sourceData.recommendedSystemType || sourceData.systemType || 'grid-tie',
        panelsNeeded: parseSafeNumber(systemDetails.panelsNeeded) || sourceData.panelsNeeded || null,
        inverterType: systemDetails.inverterType || null,
        batteryType: systemDetails.batteryType || null,
        totalCost: totalCost,
        initialPayment: paymentPreference === 'installment' ? totalCost * 0.3 : 0,
        progressPayment: paymentPreference === 'installment' ? totalCost * 0.4 : 0,
        finalPayment: paymentPreference === 'installment' ? totalCost * 0.3 : 0,
        amountPaid: 0,
        balance: totalCost,
        paymentSchedule: paymentSchedule,
        quotationFile: sourceData.finalQuotation || sourceData.quotation?.quotationUrl,
        status: paymentPreference === 'full' ? 'approved' : 'quoted',
        projectName: `${client.contactFirstName} ${client.contactLastName} - Solar Installation`,
        sourceType: 'pre-assessment',
        sourceId: sourceData._id,
        paymentPreference: paymentPreference || 'installment',
        fullPaymentCompleted: false
      };
    } else {
      return res.status(400).json({ message: 'Invalid source type' });
    }

    // Remove any undefined or NaN values
    Object.keys(projectData).forEach(key => {
      if (projectData[key] === undefined || (typeof projectData[key] === 'number' && isNaN(projectData[key]))) {
        delete projectData[key];
      }
    });

    const project = new Project(projectData);
    await project.save();

    // Update the source to mark as accepted
    if (sourceData.assessmentStatus) {
      sourceData.assessmentStatus = 'quotation_accepted';
      await sourceData.save();
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });

  } catch (error) {
    console.error('Create project from acceptance error:', error);
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};

// controllers/projectController.js - Replace your processFullPayment function with this

// @desc    Process full payment for project (no discount)
// @route   POST /api/projects/:id/full-payment
// @access  Private (Customer)
exports.processFullPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Parse the request body properly
    let amount, paymentMethod, paymentReference, paymentType;
    
    // Handle both FormData and JSON requests
    if (req.body.amount) {
      amount = parseFloat(req.body.amount);
      paymentMethod = req.body.paymentMethod;
      paymentReference = req.body.paymentReference;
      paymentType = req.body.paymentType;
    } else {
      amount = parseFloat(req.body.amount);
      paymentMethod = req.body.paymentMethod;
      paymentReference = req.body.paymentReference;
      paymentType = req.body.paymentType;
    }

    console.log('Full payment request:', { id, amount, paymentMethod, paymentReference, paymentType });

    // Validate required fields
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('Project found:', {
      id: project._id,
      paymentPreference: project.paymentPreference,
      totalCost: project.totalCost,
      fullPaymentCompleted: project.fullPaymentCompleted
    });

    const client = await Client.findOne({ userId });
    if (!client || project.clientId.toString() !== client._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if full payment is applicable
    if (project.paymentPreference !== 'full') {
      return res.status(400).json({ 
        message: 'Full payment not selected for this project. Selected: ' + project.paymentPreference 
      });
    }

    if (project.fullPaymentCompleted) {
      return res.status(400).json({ message: 'Full payment already completed' });
    }

    const expectedAmount = project.totalCost;
    
    // Compare with tolerance for floating point errors
    const amountDifference = Math.abs(amount - expectedAmount);
    if (amountDifference > 0.01) { // Allow 1 cent difference
      return res.status(400).json({ 
        message: `Payment amount should be ${expectedAmount}, but received ${amount}`,
        expected: expectedAmount,
        received: amount
      });
    }

    // Handle file upload for GCash proof
    let paymentProofUrl = null;
    if (req.file) {
      paymentProofUrl = req.file.path;
    }

    // Record the payment
    await project.recordFullPayment(expectedAmount, paymentMethod, paymentReference, paymentProofUrl);

    res.json({
      success: true,
      message: 'Full payment processed successfully',
      project: {
        id: project._id,
        amountPaid: project.amountPaid,
        balance: project.balance,
        status: project.status,
        fullPaymentCompleted: project.fullPaymentCompleted
      }
    });

  } catch (error) {
    console.error('Full payment error:', error);
    res.status(500).json({ message: 'Failed to process full payment', error: error.message });
  }
};