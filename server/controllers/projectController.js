// controllers/projectController.js
const Project = require('../models/Project');
const Client = require('../models/Clients');
const FreeQuote = require('../models/FreeQuote');
const PreAssessment = require('../models/PreAssessment');
const User = require('../models/Users');
const mongoose = require('mongoose');
const PayMongoService = require('../services/paymongoService');
const SolarInvoice = require('../models/SolarInvoice');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (should already be configured in your app)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to format currency (for internal use)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Helper function to generate project reference
const generateProjectReference = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PROJ-${year}${month}-${random}`;
};

// Helper function to parse safe numbers
const parseSafeNumber = (value) => {
  if (!value) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

// Helper function to generate invoice number
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SOL-${year}${month}${day}-${random}`;
};

// Helper function to get invoice item name with correct percentage
const getInvoiceItemName = (invoiceType, project, paymentPreference) => {
  const typeLabels = {
    'initial': `Initial Deposit - ${project.projectName}`,
    'progress': `Progress Payment - ${project.projectName}`,
    'final': `Final Payment - ${project.projectName}`,
    'full': `Full Payment - ${project.projectName}`,
    'additional': `Additional Work - ${project.projectName}`
  };
  return typeLabels[invoiceType] || `Solar Installation Payment - ${project.projectName}`;
};

// Helper function to get invoice type label with percentage
const getInvoiceTypeLabel = (invoiceType, paymentPreference) => {
  const labels = {
    'initial': 'Initial Deposit',
    'progress': 'Progress Payment',
    'final': 'Final Payment',
    'full': 'Full Payment',
    'additional': 'Additional Work'
  };
  return labels[invoiceType] || invoiceType;
};

// =============================================
// UPLOAD PROJECT PHOTOS
// =============================================

// @desc    Upload project photos (Engineer) - Direct Cloudinary Upload
// @route   POST /api/projects/:id/upload-photos
// @access  Private (Engineer)
exports.uploadProjectPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
    const files = req.files;

    console.log('📸 Uploading photos for project:', id);
    console.log('📁 Files received:', files?.length || 0);

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const File = require('../models/File');
    const photoUrls = [];

    for (const file of files) {
      try {
        console.log(`⬆️ Uploading: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `solar-tps/projects/${project.projectReference}/site-photos`,
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          const bufferStream = require('stream').Readable.from(file.buffer);
          bufferStream.pipe(uploadStream);
        });

        console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
        photoUrls.push(result.secure_url);

        const fileRecord = new File({
          filename: result.public_id.split('/').pop(),
          originalName: file.originalname,
          fileType: 'project_photo',
          mimeType: file.mimetype,
          size: file.size,
          url: result.secure_url,
          publicId: result.public_id,
          uploadedBy: engineerId,
          userRole: 'engineer',
          relatedTo: 'project',
          relatedId: project._id,
          metadata: {
            projectId: project._id,
            projectReference: project.projectReference,
            uploadType: 'site_photo',
            storageType: 'cloudinary',
            uploadedAt: new Date().toISOString()
          }
        });
        
        await fileRecord.save();

      } catch (uploadError) {
        console.error('❌ Cloudinary upload error for file:', file.originalname, uploadError.message);
      }
    }

    if (photoUrls.length === 0) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to upload any photos to Cloudinary. Please check your Cloudinary credentials.' 
      });
    }

    project.sitePhotos = [...(project.sitePhotos || []), ...photoUrls];
    await project.save();

    console.log(`✅ Successfully uploaded ${photoUrls.length} photos to Cloudinary`);
    console.log('📷 Photo URLs:', photoUrls);

    res.json({
      success: true,
      message: `${photoUrls.length} photo(s) uploaded successfully`,
      photos: photoUrls,
      totalPhotos: project.sitePhotos.length
    });

  } catch (error) {
    console.error('❌ Upload photos error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload photos', 
      error: error.message 
    });
  }
};

// =============================================
// PAYMONGO PAYMENT FUNCTIONS
// =============================================

// @desc    Create PayMongo payment intent for project payment
// @route   POST /api/projects/:id/create-payment-intent/:paymentId
// @access  Private (Customer)
exports.createProjectPayMongoPaymentIntent = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const userId = req.user.id;
    const { paymentMethod } = req.body;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const project = await Project.findOne({
      _id: id,
      clientId: client._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    let paymentAmount = 0;
    let paymentTypeName = '';

    if (paymentId === 'full') {
      if (project.fullPaymentCompleted) {
        return res.status(400).json({ message: 'Full payment already completed' });
      }
      paymentAmount = project.totalCost - project.amountPaid;
      paymentTypeName = 'full';
    } else {
      const payment = project.paymentSchedule.find(p => p.type === paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      if (payment.status === 'paid') {
        return res.status(400).json({ message: 'Payment already completed' });
      }
      paymentAmount = payment.amount;
      paymentTypeName = payment.type;
    }

    const paymentIntent = await PayMongoService.createPaymentIntent(
      paymentAmount,
      `${project.projectName} - ${paymentTypeName.toUpperCase()} Payment`,
      {
        type: 'project_payment',
        projectId: project._id.toString(),
        paymentId: paymentId,
        paymentType: paymentTypeName,
        clientId: client._id.toString(),
        clientName: `${client.contactFirstName} ${client.contactLastName}`
      }
    );

    if (!paymentIntent.success) {
      return res.status(500).json({ message: paymentIntent.error });
    }

    project.paymongoPaymentIntentId = paymentIntent.paymentIntentId;
    project.currentPaymentId = paymentId;
    await project.save();

    if (paymentMethod === 'gcash') {
      const gcashPayment = await PayMongoService.createGCashPaymentSource(paymentIntent.paymentIntentId);

      if (!gcashPayment.success) {
        return res.status(500).json({ message: gcashPayment.error });
      }

      return res.json({
        success: true,
        redirectUrl: gcashPayment.redirectUrl,
        paymentIntentId: paymentIntent.paymentIntentId,
        type: 'redirect'
      });
    }

    return res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: paymentIntent.amount,
      type: 'card'
    });

  } catch (error) {
    console.error('Create project payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
  }
};

// @desc    Verify PayMongo project payment after redirect
// @route   POST /api/projects/verify-paymongo-payment
// @access  Private (Customer)
exports.verifyProjectPayMongoPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const project = await Project.findOne({
      paymongoPaymentIntentId: paymentIntentId,
      clientId: client._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const paymentIntent = await PayMongoService.getPaymentIntent(paymentIntentId);

    if (!paymentIntent.success) {
      return res.status(500).json({ message: paymentIntent.error });
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        message: `Payment not successful. Status: ${paymentIntent.status}`
      });
    }

    const metadata = paymentIntent.metadata;
    const paymentId = metadata.paymentId;
    const paymentTypeName = metadata.paymentType;

    if (paymentId === 'full') {
      await project.recordFullPayment(
        paymentIntent.amount,
        'paymongo',
        paymentIntentId,
        null
      );
    } else {
      const scheduleItem = project.paymentSchedule.find(p => p.type === paymentTypeName);
      if (scheduleItem && scheduleItem.status !== 'paid') {
        scheduleItem.paidAt = new Date();
        scheduleItem.status = 'paid';
        scheduleItem.paymentReference = paymentIntentId;
        scheduleItem.paymentGateway = 'paymongo';

        project.amountPaid += scheduleItem.amount;
        project.balance = project.totalCost - project.amountPaid;

        if (paymentTypeName === 'initial' && project.status === 'approved') {
          project.status = 'initial_paid';
        } else if (paymentTypeName === 'progress' && project.status === 'in_progress') {
          project.status = 'progress_paid';
        } else if (project.amountPaid >= project.totalCost) {
          project.status = 'full_paid';
        }

        await project.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      project: {
        id: project._id,
        projectReference: project.projectReference,
        amountPaid: project.amountPaid,
        balance: project.balance,
        status: project.status
      }
    });

  } catch (error) {
    console.error('Verify project payment error:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};

// =============================================
// CUSTOMER FUNCTIONS
// =============================================

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
      .populate('assignedEngineerId', 'firstName lastName email fullName name')
      .populate('preAssessmentId')
      .populate('addressId')
      .sort({ createdAt: -1 });
    
    const processedProjects = projects.map(project => {
      const projectObj = project.toObject();
      
      if (projectObj.assignedEngineerId) {
        const engineer = projectObj.assignedEngineerId;
        let engineerFullName = '';
        
        if (engineer.fullName && engineer.fullName !== 'undefined undefined') {
          engineerFullName = engineer.fullName;
        } else if (engineer.firstName && engineer.lastName) {
          engineerFullName = `${engineer.firstName} ${engineer.lastName}`.trim();
        } else if (engineer.firstName) {
          engineerFullName = engineer.firstName;
        } else if (engineer.lastName) {
          engineerFullName = engineer.lastName;
        } else if (engineer.name) {
          engineerFullName = engineer.name;
        } else if (engineer.email) {
          const emailName = engineer.email.split('@')[0];
          engineerFullName = emailName
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
        } else {
          engineerFullName = 'Engineer assigned';
        }
        
        projectObj.engineerFullName = engineerFullName;
      } else {
        projectObj.engineerFullName = null;
      }
      
      return projectObj;
    });

    res.json({
      success: true,
      projects: processedProjects
    });

  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

// =============================================
// ⭐ CREATE PROJECT FROM ACCEPTED QUOTATION
// =============================================

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

    // =============================================
    // ✅ HANDLE FREE QUOTE SOURCE
    // =============================================
    if (sourceType === 'free-quote') {
      sourceData = await FreeQuote.findById(sourceId).populate('addressId');
      if (!sourceData || sourceData.clientId.toString() !== client._id.toString()) {
        return res.status(404).json({ message: 'Free quote not found' });
      }

      const systemSize = sourceData.quotationDetails?.systemSize || 
                         sourceData.recommendedSystemSize || 
                         sourceData.desiredCapacity || 
                         5;
      
      const totalCost = sourceData.quotationDetails?.totalCost || 
                        (sourceData.quotationDetails?.equipmentCost || 0) + 
                        (sourceData.quotationDetails?.installationCost || 0) ||
                        0;
      
      const systemType = sourceData.quotationDetails?.systemType || 
                         sourceData.systemType || 
                         'grid-tie';
      
      const panelsNeeded = sourceData.quotationDetails?.panelsNeeded || 
                           sourceData.panelsNeeded || 
                           Math.ceil(systemSize / 0.55);
      
      const inverterType = sourceData.quotationDetails?.equipmentBreakdown?.inverter?.name || null;
      const batteryType = sourceData.quotationDetails?.equipmentBreakdown?.battery?.name || null;

      // Calculate payment schedule based on preference
      let paymentSchedule = [];
      let initialPayment = 0;
      let progressPayment = 0;
      let finalPayment = 0;

      if (paymentPreference === 'full') {
        paymentSchedule.push({
          type: 'full',
          amount: totalCost,
          dueDate: new Date(),
          status: 'pending'
        });
      } else if (paymentPreference === 'fifty_fifty') {
        initialPayment = totalCost * 0.5;
        finalPayment = totalCost * 0.5;
        
        paymentSchedule.push({
          type: 'initial',
          amount: initialPayment,
          dueDate: new Date(),
          status: 'pending'
        });
        paymentSchedule.push({
          type: 'final',
          amount: finalPayment,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
      } else if (paymentPreference === 'thirty_sixty_ten') {
        initialPayment = totalCost * 0.3;
        progressPayment = totalCost * 0.6;
        finalPayment = totalCost * 0.1;
        
        paymentSchedule.push({
          type: 'initial',
          amount: initialPayment,
          dueDate: new Date(),
          status: 'pending'
        });
        paymentSchedule.push({
          type: 'progress',
          amount: progressPayment,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
        paymentSchedule.push({
          type: 'final',
          amount: finalPayment,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
      } else {
        // Default: 30% - 40% - 30%
        initialPayment = totalCost * 0.3;
        progressPayment = totalCost * 0.4;
        finalPayment = totalCost * 0.3;
        
        paymentSchedule.push({
          type: 'initial',
          amount: initialPayment,
          dueDate: new Date(),
          status: 'pending'
        });
        paymentSchedule.push({
          type: 'progress',
          amount: progressPayment,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
        paymentSchedule.push({
          type: 'final',
          amount: finalPayment,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
      }

      projectData = {
        projectReference: generateProjectReference(),
        clientId: client._id,
        userId: client.userId,
        addressId: sourceData.addressId?._id,
        systemSize: parseFloat(systemSize),
        systemType: systemType,
        panelsNeeded: parseInt(panelsNeeded) || 0,
        inverterType: inverterType,
        batteryType: batteryType,
        totalCost: totalCost,
        initialPayment: initialPayment,
        progressPayment: progressPayment,
        finalPayment: finalPayment,
        amountPaid: 0,
        balance: totalCost,
        paymentSchedule: paymentSchedule,
        quotationFile: sourceData.quotationFile || sourceData.quotationUrl,
        status: paymentPreference === 'full' ? 'approved' : 'quoted',
        projectName: `${client.contactFirstName} ${client.contactLastName} - Solar Installation`,
        sourceType: 'free-quote',
        sourceId: sourceData._id,
        paymentPreference: paymentPreference || 'installment',
        fullPaymentCompleted: false
      };

      console.log(`✅ Free quote accepted: ${sourceData.quotationReference} with payment: ${paymentPreference}`);

    // =============================================
    // ✅ HANDLE PRE-ASSESSMENT SOURCE
    // =============================================
    } else if (sourceType === 'pre-assessment') {
      sourceData = await PreAssessment.findById(sourceId).populate('addressId');
      if (!sourceData || sourceData.clientId.toString() !== client._id.toString()) {
        return res.status(404).json({ message: 'Pre-assessment not found' });
      }

      const systemDetails = sourceData.quotation?.systemDetails || {};
      const totalCost = systemDetails.totalCost || sourceData.finalSystemCost || 0;

      let paymentSchedule = [];
      let initialPayment = 0;
      let progressPayment = 0;
      let finalPayment = 0;

      if (paymentPreference === 'full') {
        paymentSchedule.push({
          type: 'full',
          amount: totalCost,
          dueDate: new Date(),
          status: 'pending'
        });
      } else if (paymentPreference === 'fifty_fifty') {
        initialPayment = totalCost * 0.5;
        finalPayment = totalCost * 0.5;
        
        paymentSchedule.push({
          type: 'initial',
          amount: initialPayment,
          dueDate: new Date(),
          status: 'pending'
        });
        paymentSchedule.push({
          type: 'final',
          amount: finalPayment,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
      } else if (paymentPreference === 'thirty_sixty_ten') {
        initialPayment = totalCost * 0.3;
        progressPayment = totalCost * 0.6;
        finalPayment = totalCost * 0.1;
        
        paymentSchedule.push({
          type: 'initial',
          amount: initialPayment,
          dueDate: new Date(),
          status: 'pending'
        });
        paymentSchedule.push({
          type: 'progress',
          amount: progressPayment,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
        paymentSchedule.push({
          type: 'final',
          amount: finalPayment,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
      } else {
        // Default: 30% - 40% - 30%
        initialPayment = totalCost * 0.3;
        progressPayment = totalCost * 0.4;
        finalPayment = totalCost * 0.3;
        
        paymentSchedule.push({
          type: 'initial',
          amount: initialPayment,
          dueDate: new Date(),
          status: 'pending'
        });
        paymentSchedule.push({
          type: 'progress',
          amount: progressPayment,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
        paymentSchedule.push({
          type: 'final',
          amount: finalPayment,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
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
        initialPayment: initialPayment,
        progressPayment: progressPayment,
        finalPayment: finalPayment,
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

      console.log(`✅ Pre-assessment accepted: ${sourceData.bookingReference} with payment: ${paymentPreference}`);

    } else {
      return res.status(400).json({ message: 'Invalid source type. Must be "free-quote" or "pre-assessment"' });
    }

    // Remove any undefined or NaN values
    Object.keys(projectData).forEach(key => {
      if (projectData[key] === undefined || (typeof projectData[key] === 'number' && isNaN(projectData[key]))) {
        delete projectData[key];
      }
    });

    const project = new Project(projectData);
    await project.save();

    // ✅ Update the source to mark as accepted
    if (sourceType === 'free-quote') {
      sourceData.status = 'accepted';
      await sourceData.save();
      console.log(`✅ Free quote ${sourceData.quotationReference} marked as accepted`);
    } else if (sourceType === 'pre-assessment') {
      if (sourceData.assessmentStatus) {
        sourceData.assessmentStatus = 'quotation_accepted';
        await sourceData.save();
        console.log(`✅ Pre-assessment ${sourceData.bookingReference} marked as quotation_accepted`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: {
        _id: project._id,
        projectReference: project.projectReference,
        projectName: project.projectName,
        totalCost: project.totalCost,
        status: project.status,
        paymentPreference: project.paymentPreference,
        sourceType: project.sourceType,
        paymentSchedule: project.paymentSchedule
      }
    });

  } catch (error) {
    console.error('Create project from acceptance error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create project', 
      error: error.message 
    });
  }
};

// =============================================
// RECORD PAYMENT (Customer)
// =============================================

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

// =============================================
// ENGINEER FUNCTIONS
// =============================================

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
      .populate({
        path: 'clientId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
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

    const validTransitions = {
      'quoted': ['approved'],
      'approved': ['initial_paid', 'in_progress', 'cancelled'],
      'initial_paid': ['in_progress', 'cancelled'],
      'full_paid': ['in_progress', 'completed', 'cancelled'],
      'in_progress': ['progress_paid', 'full_paid', 'completed', 'cancelled'],
      'progress_paid': ['completed', 'in_progress', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (status && validTransitions[project.status] && !validTransitions[project.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${project.status} to ${status}. Allowed transitions: ${validTransitions[project.status]?.join(', ') || 'none'}`
      });
    }

    if (installationNotes) project.installationNotes = installationNotes;
    if (sitePhotos) project.sitePhotos = [...(project.sitePhotos || []), ...sitePhotos];
    
    if (status) {
      const oldStatus = project.status;
      project.status = status;

      if (!project.projectUpdates) project.projectUpdates = [];
      
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

// =============================================
// ADMIN FUNCTIONS
// =============================================

// @desc    Get all projects (Admin)
// @route   GET /api/projects
// @access  Private (Admin)
exports.getAllProjects = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;

    const projects = await Project.find(query)
      .populate({
        path: 'clientId',
        select: 'contactFirstName contactLastName contactNumber userId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
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

// =============================================
// ⭐ FIXED: INVOICE FUNCTIONS - SUPPORTS ALL PAYMENT PLANS
// =============================================

const createSolarInvoice = async (project, invoiceType, amount, adminId, customDueDate = null) => {
  try {
    const clientId = project.clientId._id || project.clientId;
    const userId = project.userId;

    let dueDate = customDueDate;
    if (!dueDate) {
      if (invoiceType === 'initial') {
        dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else if (invoiceType === 'progress') {
        dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (invoiceType === 'final') {
        dueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      } else if (invoiceType === 'full') {
        dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      } else {
        dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      }
    }

    const subtotal = amount;
    const tax = subtotal * 0.12;
    const totalAmount = subtotal + tax;

    // Get payment preference for display
    const paymentPref = project.paymentPreference || 'installment';
    
    // Build description with percentage info
    let percentageLabel = '';
    if (invoiceType === 'initial') {
      if (paymentPref === 'fifty_fifty') percentageLabel = ' (50%)';
      else if (paymentPref === 'thirty_sixty_ten') percentageLabel = ' (30%)';
      else percentageLabel = ' (30%)';
    } else if (invoiceType === 'progress') {
      if (paymentPref === 'thirty_sixty_ten') percentageLabel = ' (60%)';
      else percentageLabel = ' (40%)';
    } else if (invoiceType === 'final') {
      if (paymentPref === 'fifty_fifty') percentageLabel = ' (50%)';
      else if (paymentPref === 'thirty_sixty_ten') percentageLabel = ' (10%)';
      else percentageLabel = ' (30%)';
    }

    const invoiceItems = [{
      name: `${getInvoiceTypeLabel(invoiceType)}${percentageLabel} - ${project.projectName}`,
      description: `${getInvoiceTypeLabel(invoiceType)} payment${percentageLabel} for solar installation`,
      quantity: 1,
      unitPrice: amount,
      total: amount
    }];

    const invoice = new SolarInvoice({
      projectId: project._id,
      clientId: clientId,
      userId: userId,
      invoiceNumber: generateInvoiceNumber(),
      quotationReference: project.projectReference,
      invoiceType: invoiceType,
      description: `${getInvoiceTypeLabel(invoiceType)}${percentageLabel} for ${project.projectName}`,
      items: invoiceItems,
      subtotal: subtotal,
      tax: tax,
      discount: 0,
      totalAmount: totalAmount,
      dueDate: dueDate,
      issueDate: new Date(),
      paymentStatus: 'pending',
      status: 'pending',
      amountPaid: 0,
      balance: totalAmount,
      createdBy: adminId,
      notes: `Auto-generated upon project approval (${paymentPref})`
    });

    await invoice.save();

    project.invoices = project.invoices || [];
    project.invoices.push({
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      amount: totalAmount,
      issuedAt: new Date()
    });

    console.log(`✅ Invoice created: ${invoice.invoiceNumber} (${invoiceType}) for project ${project.projectReference}`);
    return invoice;

  } catch (error) {
    console.error(`Error creating ${invoiceType} invoice:`, error);
    throw error;
  }
};

// ⭐ FIXED: Generate invoices based on payment preference
const generateProjectInvoices = async (project, adminId) => {
  try {
    const invoicesCreated = [];

    if (!project.clientId || !project.clientId._id) {
      console.error('Project clientId not populated:', project._id);
      throw new Error('Client information not available. Make sure to populate clientId when fetching project.');
    }

    const paymentPreference = project.paymentPreference || 'installment';
    console.log(`📋 Generating invoices for payment plan: ${paymentPreference}`);

    // =============================================
    // FULL PAYMENT: Single invoice
    // =============================================
    if (paymentPreference === 'full') {
      const fullPayment = project.paymentSchedule.find(p => p.type === 'full');
      if (fullPayment && fullPayment.status !== 'paid') {
        const invoice = await createSolarInvoice(project, 'full', fullPayment.amount, adminId);
        invoicesCreated.push(invoice);
        fullPayment.invoiceNumber = invoice.invoiceNumber;
        console.log(`✅ Full payment invoice created: ${invoice.invoiceNumber}`);
      }
    } 
    // =============================================
    // 50% - 50%: Initial + Final
    // =============================================
    else if (paymentPreference === 'fifty_fifty') {
      const initialPayment = project.paymentSchedule.find(p => p.type === 'initial');
      const finalPayment = project.paymentSchedule.find(p => p.type === 'final');

      if (initialPayment && initialPayment.status !== 'paid') {
        const invoice = await createSolarInvoice(project, 'initial', initialPayment.amount, adminId);
        invoicesCreated.push(invoice);
        initialPayment.invoiceNumber = invoice.invoiceNumber;
        console.log(`✅ 50% initial invoice created: ${invoice.invoiceNumber}`);
      }

      if (finalPayment && finalPayment.status !== 'paid') {
        const invoice = await createSolarInvoice(project, 'final', finalPayment.amount, adminId, finalPayment.dueDate);
        invoicesCreated.push(invoice);
        finalPayment.invoiceNumber = invoice.invoiceNumber;
        console.log(`✅ 50% final invoice created: ${invoice.invoiceNumber}`);
      }
    } 
    // =============================================
    // 30% - 60% - 10%: Initial + Progress + Final (Retention)
    // =============================================
    else if (paymentPreference === 'thirty_sixty_ten') {
      const initialPayment = project.paymentSchedule.find(p => p.type === 'initial');
      const progressPayment = project.paymentSchedule.find(p => p.type === 'progress');
      const finalPayment = project.paymentSchedule.find(p => p.type === 'final');

      if (initialPayment && initialPayment.status !== 'paid') {
        const invoice = await createSolarInvoice(project, 'initial', initialPayment.amount, adminId);
        invoicesCreated.push(invoice);
        initialPayment.invoiceNumber = invoice.invoiceNumber;
        console.log(`✅ 30% initial invoice created: ${invoice.invoiceNumber}`);
      }

      if (progressPayment && progressPayment.status !== 'paid') {
        const invoice = await createSolarInvoice(project, 'progress', progressPayment.amount, adminId, progressPayment.dueDate);
        invoicesCreated.push(invoice);
        progressPayment.invoiceNumber = invoice.invoiceNumber;
        console.log(`✅ 60% progress invoice created: ${invoice.invoiceNumber}`);
      }

      if (finalPayment && finalPayment.status !== 'paid') {
        const invoice = await createSolarInvoice(project, 'final', finalPayment.amount, adminId, finalPayment.dueDate);
        invoicesCreated.push(invoice);
        finalPayment.invoiceNumber = invoice.invoiceNumber;
        console.log(`✅ 10% final (retention) invoice created: ${invoice.invoiceNumber}`);
      }
    } 
    // =============================================
    // DEFAULT: 30% - 40% - 30% (Installment)
    // =============================================
    else {
      const initialPayment = project.paymentSchedule.find(p => p.type === 'initial');
      const progressPayment = project.paymentSchedule.find(p => p.type === 'progress');
      const finalPayment = project.paymentSchedule.find(p => p.type === 'final');

      if (initialPayment && initialPayment.status !== 'paid') {
        const invoice = await createSolarInvoice(project, 'initial', initialPayment.amount, adminId);
        invoicesCreated.push(invoice);
        initialPayment.invoiceNumber = invoice.invoiceNumber;
        console.log(`✅ 30% initial invoice created: ${invoice.invoiceNumber}`);
      }

      if (progressPayment && progressPayment.status !== 'paid') {
        const invoice = await createSolarInvoice(project, 'progress', progressPayment.amount, adminId, progressPayment.dueDate);
        invoicesCreated.push(invoice);
        progressPayment.invoiceNumber = invoice.invoiceNumber;
        console.log(`✅ 40% progress invoice created: ${invoice.invoiceNumber}`);
      }

      if (finalPayment && finalPayment.status !== 'paid') {
        const invoice = await createSolarInvoice(project, 'final', finalPayment.amount, adminId, finalPayment.dueDate);
        invoicesCreated.push(invoice);
        finalPayment.invoiceNumber = invoice.invoiceNumber;
        console.log(`✅ 30% final invoice created: ${invoice.invoiceNumber}`);
      }
    }

    await project.save();
    console.log(`✅ Total ${invoicesCreated.length} invoices generated for project ${project.projectReference}`);
    return invoicesCreated;

  } catch (error) {
    console.error('Error generating invoices:', error);
    throw error;
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

    const project = await Project.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId email')
      .populate('addressId');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const validTransitions = {
      'quoted': ['approved', 'cancelled'],
      'approved': ['initial_paid', 'full_paid', 'cancelled'],
      'full_paid': ['in_progress', 'cancelled'],
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

      try {
        const invoicesCreated = await generateProjectInvoices(project, adminId);
        console.log(`✅ ${invoicesCreated.length} invoices auto-generated for project ${project.projectReference}`);
      } catch (invoiceError) {
        console.error('Failed to generate invoices:', invoiceError);
        return res.status(200).json({
          success: true,
          message: `Project status updated to ${status}, but invoice generation failed: ${invoiceError.message}`,
          project,
          invoicesGenerated: false,
          invoiceError: invoiceError.message
        });
      }
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
      project,
      invoicesGenerated: status === 'approved' ? true : false
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

    const invoice = await SolarInvoice.findOne({
      projectId: id,
      invoiceType: paymentType,
      paymentStatus: { $in: ['pending', 'partial'] }
    });

    const scheduleItem = project.paymentSchedule.find(p => p.type === paymentType);
    if (scheduleItem) {
      scheduleItem.status = 'paid';
      scheduleItem.paidAt = new Date();
      scheduleItem.paymentReference = paymentReference;
    }

    project.amountPaid += amount;
    project.balance = project.totalCost - project.amountPaid;

    if (paymentType === 'initial' && project.status === 'approved') {
      project.status = 'initial_paid';
    } else if (paymentType === 'progress' && project.status === 'in_progress') {
      project.status = 'progress_paid';
    } else if (paymentType === 'final') {
      if (project.amountPaid >= project.totalCost) {
        project.status = 'full_paid';
      }
    } else if (paymentType === 'full') {
      if (project.amountPaid >= project.totalCost) {
        project.status = 'full_paid';
        project.fullPaymentCompleted = true;
      }
    }

    if (invoice) {
      await invoice.addPayment({
        amount: amount,
        method: 'cash',
        reference: paymentReference,
        date: new Date(),
        notes: `Payment recorded by admin`,
        receivedBy: adminId
      });
      console.log(`Invoice ${invoice.invoiceNumber} updated with payment of ${amount}`);
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
      },
      invoiceUpdated: !!invoice
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
    const fullPaid = await Project.countDocuments({ status: 'full_paid' });
    const inProgress = await Project.countDocuments({ status: 'in_progress' });
    const progressPaid = await Project.countDocuments({ status: 'progress_paid' });
    const completed = await Project.countDocuments({ status: 'completed' });
    const cancelled = await Project.countDocuments({ status: 'cancelled' });

    const revenueResult = await Project.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const fromPreAssessment = await Project.countDocuments({ sourceType: 'pre-assessment' });
    const fromFreeQuote = await Project.countDocuments({ sourceType: 'free-quote' });
    const fromAdmin = await Project.countDocuments({ sourceType: 'admin' });

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
        fullPaid,
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

// @desc    Process full payment for project
// @route   POST /api/projects/:id/full-payment
// @access  Private (Customer)
exports.processFullPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let amount, paymentMethod, paymentReference, paymentType;

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

    const client = await Client.findOne({ userId });
    if (!client || project.clientId.toString() !== client._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (project.paymentPreference !== 'full') {
      return res.status(400).json({
        message: 'Full payment not selected for this project. Selected: ' + project.paymentPreference
      });
    }

    if (project.fullPaymentCompleted) {
      return res.status(400).json({ message: 'Full payment already completed' });
    }

    const expectedAmount = project.totalCost;
    const amountDifference = Math.abs(amount - expectedAmount);
    if (amountDifference > 0.01) {
      return res.status(400).json({
        message: `Payment amount should be ${expectedAmount}, but received ${amount}`,
        expected: expectedAmount,
        received: amount
      });
    }

    let paymentProofUrl = null;
    if (req.file) {
      paymentProofUrl = req.file.path;
    }

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