// controllers/freeQuoteControllers.js
const FreeQuote = require('../models/FreeQuote');
const Client = require('../models/Clients');
const User = require('../models/Users');
const Address = require('../models/Address');
const File = require('../models/File');
const PDFGenerator = require('../services/pdfGenerator');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

// Configure Cloudinary (if not already configured elsewhere)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// SYSTEM_TYPES for reference
const SYSTEM_TYPES = [
  { value: 'grid-tie', label: 'Grid-Tie System' },
  { value: 'hybrid', label: 'Hybrid System' },
  { value: 'off-grid', label: 'Off-Grid System' }
];



// @desc    Create a new free quote request
// @route   POST /api/free-quotes
// @access  Private (Customer)
exports.createFreeQuote = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      clientId,
      addressId,
      monthlyBill,
      propertyType,
      desiredCapacity,
      systemType,
      roofLength,
      roofWidth
    } = req.body;

    // Find client 
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Verify client ID matches
    if (client._id.toString() !== clientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Verify address if provided
    if (addressId) {
      const address = await Address.findOne({ _id: addressId, clientId: client._id });
      if (!address) {
        return res.status(404).json({ success: false, message: 'Address not found' });
      }
    }

    // Generate quotation reference
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const quotationReference = `Q-${year}${month}${day}-${random}`;

    // Create free quote object
    const freeQuote = new FreeQuote({
      clientId: client._id,
      addressId: addressId || null,
      monthlyBill: parseFloat(monthlyBill),
      propertyType: propertyType,
      desiredCapacity: desiredCapacity || '',
      systemType: systemType || null,
      roofLength: roofLength ? parseFloat(roofLength) : null,
      roofWidth: roofWidth ? parseFloat(roofWidth) : null,
      status: 'pending',
      quotationReference: quotationReference
    });

    await freeQuote.save();

    // Populate references for response
    await freeQuote.populate('clientId', 'contactFirstName contactLastName contactNumber');
    await freeQuote.populate('addressId');
    await freeQuote.populate({
      path: 'clientId',
      populate: { path: 'userId', select: 'email' }
    });

    res.status(201).json({
      success: true,
      message: 'Free quote request submitted successfully',
      quote: {
        _id: freeQuote._id,
        quotationReference: freeQuote.quotationReference,
        monthlyBill: freeQuote.monthlyBill,
        propertyType: freeQuote.propertyType,
        desiredCapacity: freeQuote.desiredCapacity,
        roofLength: freeQuote.roofLength,
        roofWidth: freeQuote.roofWidth,
        status: freeQuote.status,
        requestedAt: freeQuote.requestedAt,
        client: {
          name: `${freeQuote.clientId.contactFirstName} ${freeQuote.clientId.contactLastName}`,
          contactNumber: freeQuote.clientId.contactNumber,
          email: freeQuote.clientId.userId?.email
        },
        address: freeQuote.addressId ? {
          fullAddress: freeQuote.addressId.getFullAddress ? freeQuote.addressId.getFullAddress() : 'Address'
        } : null
      }
    });

  } catch (error) {
    console.error('Create free quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quote request',
      error: error.message
    });
  }
};

// @desc    Get all free quotes (Admin only)
// @route   GET /api/free-quotes
// @access  Private (Admin)
exports.getAllFreeQuotes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const quotes = await FreeQuote.find(query)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('addressId')
      .populate('assignedEngineerId', 'fullName email')
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'email' }
      })
      .sort({ requestedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FreeQuote.countDocuments(query);

    res.json({
      success: true,
      quotes,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get free quotes error:', error);
    res.status(500).json({ message: 'Failed to fetch quotes', error: error.message });
  }
};

// @desc    Get client's free quotes
// @route   GET /api/free-quotes/my-quotes
// @access  Private (Customer)
exports.getMyFreeQuotes = async (req, res) => {
  try {
    const userId = req.user.id;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const quotes = await FreeQuote.find({ clientId: client._id })
      .populate('addressId')
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      quotes
    });

  } catch (error) {
    console.error('Get my free quotes error:', error);
    res.status(500).json({ message: 'Failed to fetch quotes', error: error.message });
  }
};

// @desc    Get free quote by ID
// @route   GET /api/free-quotes/:id
// @access  Private (Customer, Admin, or Assigned Engineer)
exports.getFreeQuoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const quote = await FreeQuote.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('addressId')
      .populate('assignedEngineerId', 'fullName email')
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'email' }
      })
      .populate('processedBy', 'email firstName lastName');

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Check authorization
    const client = await Client.findOne({ userId });

    // Admin can access any quote
    if (userRole === 'admin') {
      return res.json({ success: true, quote });
    }

    // Customer can access their own quotes
    if (client && quote.clientId._id.toString() === client._id.toString()) {
      return res.json({ success: true, quote });
    }

    // Engineer can access quotes assigned to them
    if (userRole === 'engineer' && quote.assignedEngineerId && quote.assignedEngineerId._id.toString() === userId) {
      return res.json({ success: true, quote });
    }

    // Otherwise, unauthorized
    return res.status(403).json({ message: 'Unauthorized' });

  } catch (error) {
    console.error('Get free quote error:', error);
    res.status(500).json({ message: 'Failed to fetch quote', error: error.message });
  }
};

// @desc    Assign engineer to free quote (Admin only)
// @route   PUT /api/free-quotes/:id/assign-engineer
// @access  Private (Admin)
exports.assignEngineerToFreeQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { engineerId, notes } = req.body;
    const adminId = req.user.id;

    // Find the free quote
    const quote = await FreeQuote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Free quote not found' });
    }

    // Check if quote is pending
    if (quote.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot assign engineer. Current status: ${quote.status}. Only pending quotes can be assigned.`
      });
    }

    // Find the engineer
    const engineer = await User.findById(engineerId);
    if (!engineer || engineer.role !== 'engineer') {
      return res.status(400).json({
        message: 'Invalid engineer selected. User must have engineer role.'
      });
    }

    // Update the free quote
    quote.assignedEngineerId = engineerId;
    quote.assignedAt = new Date();
    quote.assignedBy = adminId;
    quote.status = 'assigned';
    if (notes) quote.adminRemarks = notes;
    quote.processedBy = adminId;
    quote.processedAt = new Date();

    await quote.save();

    // Populate for response
    await quote.populate('assignedEngineerId', 'fullName email');
    await quote.populate('clientId', 'contactFirstName contactLastName contactNumber');

    res.json({
      success: true,
      message: `Engineer assigned successfully to free quote ${quote.quotationReference}`,
      quote: {
        _id: quote._id,
        quotationReference: quote.quotationReference,
        status: quote.status,
        assignedEngineer: {
          id: engineer._id,
          name: engineer.fullName,
          email: engineer.email
        },
        client: {
          name: `${quote.clientId.contactFirstName} ${quote.clientId.contactLastName}`,
          contactNumber: quote.clientId.contactNumber
        }
      }
    });

  } catch (error) {
    console.error('Assign engineer to free quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign engineer',
      error: error.message
    });
  }
};

// @desc    Update free quote status (Admin only)
// @route   PUT /api/free-quotes/:id/status
// @access  Private (Admin)
exports.updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, quotationFile } = req.body;
    const adminId = req.user.id;

    const quote = await FreeQuote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['assigned', 'cancelled'],
      assigned: ['processing', 'cancelled'],
      processing: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (validTransitions[quote.status] && !validTransitions[quote.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${quote.status} to ${status}`
      });
    }

    quote.status = status;
    if (adminRemarks) quote.adminRemarks = adminRemarks;
    if (quotationFile) quote.quotationFile = quotationFile;
    if (status === 'completed') {
      quote.quotationSentAt = new Date();
    }
    quote.processedBy = adminId;
    quote.processedAt = new Date();

    await quote.save();

    res.json({
      success: true,
      message: 'Quote status updated successfully',
      quote
    });

  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({ message: 'Failed to update quote', error: error.message });
  }
};

// @desc    Upload quotation file (Admin only)
// @route   POST /api/free-quotes/:id/upload-quotation
// @access  Private (Admin)
exports.uploadQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const quote = await FreeQuote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    quote.quotationFile = req.file.path;
    quote.status = 'completed';
    quote.quotationSentAt = new Date();
    quote.processedBy = req.user.id;
    quote.processedAt = new Date();

    await quote.save();

    res.json({
      success: true,
      message: 'Quotation uploaded successfully',
      quotationFile: quote.quotationFile
    });

  } catch (error) {
    console.error('Upload quotation error:', error);
    res.status(500).json({ message: 'Failed to upload quotation', error: error.message });
  }
};

// @desc    Cancel free quote (Customer)
// @route   PUT /api/free-quotes/:id/cancel
// @access  Private (Customer)
exports.cancelFreeQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const quote = await FreeQuote.findOne({ _id: id, clientId: client._id });
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    if (quote.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel quote that is already being processed' });
    }

    quote.status = 'cancelled';
    await quote.save();

    res.json({
      success: true,
      message: 'Quote cancelled successfully',
      quote
    });

  } catch (error) {
    console.error('Cancel free quote error:', error);
    res.status(500).json({ message: 'Failed to cancel quote', error: error.message });
  }
};

// @desc    Get free quotes assigned to engineer
// @route   GET /api/free-quotes/engineer/my-quotes
// @access  Private (Engineer)
exports.getEngineerFreeQuotes = async (req, res) => {
  try {
    const engineerId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      assignedEngineerId: engineerId,
      status: { $nin: ['cancelled'] }
    };

    if (status) query.status = status;

    const quotes = await FreeQuote.find(query)
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId.email')
      .populate('addressId')
      .populate('assignedEngineerId', 'fullName email')
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'email' }
      })
      .sort({ requestedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FreeQuote.countDocuments(query);

    res.json({
      success: true,
      quotes,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get engineer free quotes error:', error);
    res.status(500).json({ message: 'Failed to fetch quotes', error: error.message });
  }
};

// @desc    Engineer updates free quote status (Engineer only)
// @route   PUT /api/free-quotes/:id/update-status
// @access  Private (Engineer)
exports.engineerUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const engineerId = req.user.id;

    // Find the free quote
    const quote = await FreeQuote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Free quote not found' });
    }

    // Check if engineer is assigned to this quote
    if (quote.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized to update this quote' });
    }

    // Validate status transitions for engineer
    const validTransitions = {
      assigned: ['processing'],
      processing: ['completed']
    };

    if (!validTransitions[quote.status] || !validTransitions[quote.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${quote.status} to ${status}`
      });
    }

    // Update status
    quote.status = status;
    if (notes) quote.adminRemarks = notes;
    quote.processedAt = new Date();

    await quote.save();

    res.json({
      success: true,
      message: `Quote status updated to ${status}`,
      quote: {
        _id: quote._id,
        quotationReference: quote.quotationReference,
        status: quote.status
      }
    });

  } catch (error) {
    console.error('Engineer update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// @desc    Generate and upload free quote PDF with ALL equipment
// @route   POST /api/free-quotes/:id/generate-quotation
// @access  Private (Engineer)
exports.generateFreeQuotePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
    const {
      quotationNumber,
      quotationExpiryDate,
      systemSize,
      systemType,
      panelsNeeded,
      panelType,
      inverterType,
      batteryType,
      installationCost,
      equipmentCost,
      totalCost,
      paymentTerms,
      warrantyYears,
      remarks,
      equipmentDetails  // NEW: Include all equipment details
    } = req.body;

    const quote = await FreeQuote.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId')
      .populate('addressId');

    if (!quote) {
      return res.status(404).json({ message: 'Free quote not found' });
    }

    if (quote.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get system type label
    const systemTypeObj = SYSTEM_TYPES.find(t => t.value === systemType);
    const systemTypeLabel = systemTypeObj ? systemTypeObj.label : systemType;

    // Prepare cost breakdown with ALL equipment for free quote
    const costBreakdown = {
      equipment: {
        panels: {
          name: equipmentDetails?.panel?.name || panelType || 'Solar Panels',
          quantity: equipmentDetails?.panelQuantity || parseInt(panelsNeeded) || 0,
          unitPrice: equipmentDetails?.panel?.price || 0,
          total: (equipmentDetails?.panelQuantity || parseInt(panelsNeeded) || 0) * (equipmentDetails?.panel?.price || 0)
        },
        inverter: {
          name: equipmentDetails?.inverter?.name || inverterType || 'Inverter',
          quantity: equipmentDetails?.inverterQuantity || 1,
          unitPrice: equipmentDetails?.inverter?.price || 0,
          total: (equipmentDetails?.inverterQuantity || 1) * (equipmentDetails?.inverter?.price || 0)
        },
        battery: {
          name: equipmentDetails?.battery?.name || batteryType || 'No Battery',
          quantity: equipmentDetails?.batteryQuantity || 0,
          unitPrice: equipmentDetails?.battery?.price || 0,
          total: (equipmentDetails?.batteryQuantity || 0) * (equipmentDetails?.battery?.price || 0)
        },
        mountingStructure: {
          name: equipmentDetails?.mountingStructure?.name || 'Mounting Structure',
          quantity: equipmentDetails?.mountingStructureQuantity || Math.ceil((equipmentDetails?.panelQuantity || parseInt(panelsNeeded) || 0) / 4),
          unitPrice: equipmentDetails?.mountingStructure?.price || 3500,
          total: (equipmentDetails?.mountingStructureQuantity || Math.ceil((equipmentDetails?.panelQuantity || parseInt(panelsNeeded) || 0) / 4)) * (equipmentDetails?.mountingStructure?.price || 3500)
        },
        electricalComponents: {
          items: equipmentDetails?.electricalComponents || [],
          total: (equipmentDetails?.electricalComponents || []).reduce((sum, item) => sum + (item.total || 0), 0)
        },
        cables: {
          items: equipmentDetails?.cables || [],
          total: (equipmentDetails?.cables || []).reduce((sum, item) => sum + (item.total || 0), 0)
        },
        junctionBoxes: {
          items: equipmentDetails?.junctionBoxes || [],
          total: (equipmentDetails?.junctionBoxes || []).reduce((sum, item) => sum + (item.total || 0), 0)
        },
        disconnectSwitches: {
          items: equipmentDetails?.disconnectSwitches || [],
          total: (equipmentDetails?.disconnectSwitches || []).reduce((sum, item) => sum + (item.total || 0), 0)
        },
        meters: {
          items: equipmentDetails?.meters || [],
          total: (equipmentDetails?.meters || []).reduce((sum, item) => sum + (item.total || 0), 0)
        },
        additional: equipmentDetails?.additionalEquipment || []
      },
      installation: {
        perKw: {
          rate: 5000,
          quantity: systemSize || 0,
          total: (systemSize || 0) * 5000
        },
        perPanel: {
          rate: 1000,
          quantity: equipmentDetails?.panelQuantity || parseInt(panelsNeeded) || 0,
          total: (equipmentDetails?.panelQuantity || parseInt(panelsNeeded) || 0) * 1000
        },
        minimumFee: 10000,
        total: Math.max(
          ((systemSize || 0) * 5000) + ((equipmentDetails?.panelQuantity || parseInt(panelsNeeded) || 0) * 1000),
          10000
        )
      }
    };

    const calculatedEquipmentTotal =
      costBreakdown.equipment.panels.total +
      costBreakdown.equipment.inverter.total +
      costBreakdown.equipment.battery.total +
      costBreakdown.equipment.mountingStructure.total +
      costBreakdown.equipment.electricalComponents.total +
      costBreakdown.equipment.cables.total +
      costBreakdown.equipment.junctionBoxes.total +
      costBreakdown.equipment.disconnectSwitches.total +
      costBreakdown.equipment.meters.total +
      costBreakdown.equipment.additional.reduce((sum, item) => sum + (item.total || 0), 0);

    const calculatedInstallationTotal = costBreakdown.installation.total;
    const calculatedTotalCost = calculatedEquipmentTotal + calculatedInstallationTotal;

    // Prepare data for PDF
    const pdfData = {
      quotationReference: quote.quotationReference,
      clientName: `${quote.clientId.contactFirstName} ${quote.clientId.contactLastName}`,
      clientPhone: quote.clientId.contactNumber,
      clientEmail: quote.clientId.userId?.email,
      propertyType: quote.propertyType,
      address: quote.addressId ?
        `${quote.addressId.houseOrBuilding || ''} ${quote.addressId.street || ''}, ${quote.addressId.barangay || ''}, ${quote.addressId.cityMunicipality || ''}` : null,
      quotationNumber: quotationNumber || `Q-${quote.quotationReference}`,
      quotationExpiryDate,
      systemSize: parseFloat(systemSize),
      systemTypeLabel,
      panelsNeeded: equipmentDetails?.panelQuantity || parseInt(panelsNeeded) || 0,
      panelType: equipmentDetails?.panel?.name || panelType,
      inverterType: equipmentDetails?.inverter?.name || inverterType,
      batteryType: equipmentDetails?.battery?.name || batteryType,
      warrantyYears: parseInt(warrantyYears) || 10,
      paymentTerms: paymentTerms || '',
      remarks,
      costBreakdown,
      calculatedEquipmentTotal,
      calculatedInstallationTotal,
      calculatedTotalCost
    };

    // Generate PDF
    const pdfBuffer = await PDFGenerator.generateFreeQuotePDF(pdfData);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: `free-quotes/${quote.quotationReference}`,
          public_id: `quotation_${quotationNumber || quote.quotationReference}`,
          format: 'pdf',
          type: 'upload',
          access_mode: 'public'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(pdfBuffer);
    });

    // Save file record
    const fileRecord = new File({
      filename: `quotation_${quotationNumber || quote.quotationReference}.pdf`,
      originalName: `Quotation_${quote.quotationReference}.pdf`,
      fileType: 'quotation_pdf',
      mimeType: 'application/pdf',
      size: pdfBuffer.length,
      url: result.secure_url,
      publicId: result.public_id,
      uploadedBy: engineerId,
      userRole: 'engineer',
      relatedTo: 'free_quote',
      relatedId: quote._id,
      metadata: {
        quotationNumber: quotationNumber || quote.quotationReference,
        systemSize,
        systemType,
        totalCost: calculatedTotalCost,
        hasEquipmentDetails: !!equipmentDetails,
        generatedAt: new Date().toISOString()
      }
    });

    await fileRecord.save();

    // Update quote with full equipment details
    quote.quotationFile = result.secure_url;
    quote.status = 'completed';
    quote.quotationSentAt = new Date();
    quote.processedBy = engineerId;
    quote.processedAt = new Date();
    
    // Store equipment breakdown in quote
    quote.quotationDetails = {
      quotationNumber: quotationNumber || `Q-${quote.quotationReference}`,
      systemSize: parseFloat(systemSize),
      systemType,
      equipmentBreakdown: costBreakdown.equipment,
      installationCost: calculatedInstallationTotal,
      equipmentCost: calculatedEquipmentTotal,
      totalCost: calculatedTotalCost,
      paymentTerms,
      warrantyYears: parseInt(warrantyYears) || 10,
      remarks
    };

    await quote.save();

    res.json({
      success: true,
      message: 'Quotation PDF generated and uploaded successfully',
      quotation: {
        id: fileRecord._id,
        url: result.secure_url,
        quotationNumber: quotationNumber || quote.quotationReference,
        totalCost: calculatedTotalCost,
        equipmentCost: calculatedEquipmentTotal,
        installationCost: calculatedInstallationTotal,
        size: `${(pdfBuffer.length / 1024).toFixed(1)} KB`
      }
    });

  } catch (error) {
    console.error('Generate free quote PDF error:', error);
    res.status(500).json({
      message: 'Failed to generate quotation PDF',
      error: error.message
    });
  }
};

