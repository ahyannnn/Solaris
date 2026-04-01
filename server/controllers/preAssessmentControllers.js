const PreAssessment = require('../models/PreAssessment');
const Client = require('../models/Clients');
const Address = require('../models/Address');
const IoTDevice = require('../models/IoTDevice');
const SensorData = require('../models/SensorData');
const File = require('../models/File');
const { processUpload, getFileUrl, deleteFile: deleteFromStorage } = require('../middleware/uploadMiddleware');
const PDFGenerator = require('../services/pdfGenerator');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const SYSTEM_TYPES = [
  { value: 'grid-tie', label: 'Grid-Tie System', description: 'Connected to utility grid, no batteries' },
  { value: 'hybrid', label: 'Hybrid System', description: 'Grid-tie with battery backup' },
  { value: 'off-grid', label: 'Off-Grid System', description: 'Standalone with batteries, not connected to grid' }
];

// @desc    Generate and upload quotation PDF (Engineer)
// @route   POST /api/pre-assessments/:id/generate-quotation
// @access  Private (Engineer)
exports.generateQuotationPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
    const {
      quotationNumber,
      quotationExpiryDate,
      systemSize,
      systemType,
      panelsNeeded,
      inverterType,
      batteryType,
      installationCost,
      equipmentCost,
      totalCost,
      paymentTerms,
      warrantyYears,
      includeIoTData
    } = req.body;

    const assessment = await PreAssessment.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('addressId');

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Fetch IoT data if requested
    let iotAnalysis = null;
    if (includeIoTData && assessment.dataCollectionEnd) {
      const sensorData = await SensorData.find({ preAssessmentId: assessment._id });
      if (sensorData.length > 0) {
        const irradianceValues = sensorData.map(d => d.irradiance || 0).filter(v => v > 0);
        const temperatureValues = sensorData.map(d => d.temperature || 0);
        const humidityValues = sensorData.map(d => d.humidity || 0);
        
        iotAnalysis = {
          totalReadings: sensorData.length,
          averageIrradiance: irradianceValues.reduce((a, b) => a + b, 0) / irradianceValues.length,
          maxIrradiance: Math.max(...irradianceValues),
          peakSunHours: (irradianceValues.reduce((a, b) => a + b, 0) / 1000).toFixed(1),
          averageTemperature: temperatureValues.reduce((a, b) => a + b, 0) / temperatureValues.length,
          minTemperature: Math.min(...temperatureValues),
          maxTemperature: Math.max(...temperatureValues),
          efficiencyLoss: ((temperatureValues.reduce((a, b) => a + b, 0) / temperatureValues.length - 25) * 0.004 * 100).toFixed(1),
          averageHumidity: humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length,
          minHumidity: Math.min(...humidityValues),
          maxHumidity: Math.max(...humidityValues),
          recommendedSystemSize: (iotAnalysis?.peakSunHours * 0.8).toFixed(1)
        };
      }
    }

    // Prepare data for PDF
    const pdfData = {
      bookingReference: assessment.bookingReference,
      clientName: `${assessment.clientId.contactFirstName} ${assessment.clientId.contactLastName}`,
      clientPhone: assessment.clientId.contactNumber,
      clientEmail: assessment.clientId.userId?.email,
      propertyType: assessment.propertyType,
      address: assessment.addressId ? 
        `${assessment.addressId.houseOrBuilding} ${assessment.addressId.street}, ${assessment.addressId.barangay}, ${assessment.addressId.cityMunicipality}` : null,
      quotationExpiryDate,
      systemSize,
      systemTypeLabel: SYSTEM_TYPES.find(t => t.value === systemType)?.label || systemType,
      panelsNeeded,
      inverterType,
      batteryType,
      installationCost,
      equipmentCost,
      totalCost,
      paymentTerms,
      warrantyYears,
      iotAnalysis,
      siteAssessment: {
        roofCondition: assessment.engineerAssessment?.roofCondition,
        roofLength: assessment.engineerAssessment?.roofLength,
        roofWidth: assessment.engineerAssessment?.roofWidth,
        structuralIntegrity: assessment.engineerAssessment?.structuralIntegrity,
        estimatedInstallationTime: assessment.engineerAssessment?.estimatedInstallationTime,
        recommendations: assessment.engineerAssessment?.recommendations
      },
      performanceEstimates: {
        annualProduction: (systemSize || 0) * 1200,
        annualSavings: (totalCost || 0) * 0.15,
        paybackPeriod: Math.ceil((totalCost || 0) / ((systemSize || 1) * 1200 * 0.1)),
        co2Offset: (systemSize || 0) * 800
      },
      dataCollectionStart: assessment.dataCollectionStart,
      dataCollectionEnd: assessment.dataCollectionEnd
    };

    // Generate PDF
    const pdfBuffer = await PDFGenerator.generatePreAssessmentPDF(pdfData);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: `quotations/${assessment.bookingReference}`,
          public_id: `quotation_${quotationNumber || assessment.bookingReference}`,
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
      filename: `quotation_${quotationNumber || assessment.bookingReference}.pdf`,
      originalName: `Quotation_${assessment.bookingReference}.pdf`,
      fileType: 'quotation_pdf',
      mimeType: 'application/pdf',
      size: pdfBuffer.length,
      url: result.secure_url,
      publicId: result.public_id,
      uploadedBy: engineerId,
      userRole: 'engineer',
      relatedTo: 'pre_assessment',
      relatedId: assessment._id,
      metadata: {
        quotationNumber: quotationNumber || `Q-${assessment.bookingReference}`,
        systemSize,
        systemType,
        totalCost,
        includeIoTData: !!includeIoTData,
        generatedAt: new Date().toISOString()
      }
    });

    await fileRecord.save();

    // Update assessment with quotation details
    assessment.quotation = {
      quotationFileId: fileRecord._id,
      quotationUrl: result.secure_url,
      quotationNumber: quotationNumber || `Q-${assessment.bookingReference}`,
      quotationDate: new Date(),
      quotationExpiryDate: quotationExpiryDate ? new Date(quotationExpiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      systemDetails: {
        systemSize: parseFloat(systemSize),
        systemType,
        panelsNeeded: parseInt(panelsNeeded) || 0,
        inverterType,
        batteryType,
        installationCost: parseFloat(installationCost) || 0,
        equipmentCost: parseFloat(equipmentCost) || 0,
        totalCost: parseFloat(totalCost) || 0,
        paymentTerms,
        warrantyYears: parseInt(warrantyYears) || 10
      },
      generatedAt: new Date(),
      generatedBy: engineerId
    };
    
    assessment.finalQuotation = result.secure_url;
    assessment.assessmentStatus = 'report_draft';
    
    await assessment.save();

    res.json({
      success: true,
      message: 'Quotation PDF generated and uploaded successfully',
      quotation: {
        id: fileRecord._id,
        url: result.secure_url,
        quotationNumber: assessment.quotation.quotationNumber,
        totalCost: assessment.quotation.systemDetails.totalCost,
        size: `${(pdfBuffer.length / 1024).toFixed(1)} KB`
      }
    });

  } catch (error) {
    console.error('Generate quotation PDF error:', error);
    res.status(500).json({ message: 'Failed to generate quotation PDF', error: error.message });
  }
};

// @desc    Generate Free Quote PDF
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
      inverterType,
      batteryType,
      installationCost,
      equipmentCost,
      totalCost,
      paymentTerms,
      warrantyYears,
      remarks
    } = req.body;

    const quote = await FreeQuote.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('addressId');

    if (!quote) {
      return res.status(404).json({ message: 'Free quote not found' });
    }

    if (quote.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Prepare data for PDF
    const pdfData = {
      quotationReference: quote.quotationReference,
      clientName: `${quote.clientId.contactFirstName} ${quote.clientId.contactLastName}`,
      clientPhone: quote.clientId.contactNumber,
      clientEmail: quote.clientId.userId?.email,
      propertyType: quote.propertyType,
      address: quote.addressId ? 
        `${quote.addressId.houseOrBuilding} ${quote.addressId.street}, ${quote.addressId.barangay}, ${quote.addressId.cityMunicipality}` : null,
      quotationExpiryDate,
      systemSize,
      systemTypeLabel: SYSTEM_TYPES.find(t => t.value === systemType)?.label || systemType,
      panelsNeeded,
      inverterType,
      batteryType,
      installationCost,
      equipmentCost,
      totalCost,
      paymentTerms,
      warrantyYears,
      remarks
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
          format: 'pdf'
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
        totalCost,
        generatedAt: new Date().toISOString()
      }
    });

    await fileRecord.save();

    // Update quote
    quote.quotationFile = result.secure_url;
    quote.status = 'completed';
    quote.quotationSentAt = new Date();
    quote.processedBy = engineerId;
    quote.processedAt = new Date();

    await quote.save();

    res.json({
      success: true,
      message: 'Quotation PDF generated and uploaded successfully',
      quotation: {
        id: fileRecord._id,
        url: result.secure_url,
        quotationNumber: quotationNumber || quote.quotationReference,
        totalCost
      }
    });

  } catch (error) {
    console.error('Generate free quote PDF error:', error);
    res.status(500).json({ message: 'Failed to generate quotation PDF', error: error.message });
  }
};
// @desc    Create a new pre-assessment booking
// @route   POST /api/pre-assessments
// @access  Private (Customer)
// controllers/preAssessmentControllers.js

// controllers/preAssessmentControllers.js
// controllers/preAssessmentControllers.js

// @desc    Approve or reject booking (Admin only)
// @route   PUT /api/pre-assessments/:id/approve-booking
// @access  Private (Admin)
// controllers/preAssessmentControllers.js

// @desc    Approve or reject booking (Admin only)
// @route   PUT /api/pre-assessments/:id/approve-booking
// @access  Private (Admin)
exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, notes } = req.body;
    
    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    // Check if booking is pending review
    if (assessment.assessmentStatus !== 'pending_review') {
      return res.status(400).json({ message: 'Booking already processed' });
    }
    
    if (approved) {
      // Generate invoice number only when approved
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const invoiceNumber = `INV-${year}${month}${day}-${random}`;
      
      assessment.invoiceNumber = invoiceNumber;
      assessment.paymentStatus = 'pending';
      assessment.assessmentStatus = 'pending_payment'; // After approval, goes to pending payment
      assessment.adminRemarks = notes || 'Booking approved';
    } else {
      assessment.assessmentStatus = 'cancelled';
      assessment.adminRemarks = notes || 'Booking rejected by admin';
    }
    
    await assessment.save();
    
    res.json({
      success: true,
      message: approved ? 'Booking approved. Invoice generated.' : 'Booking rejected.',
      assessment: {
        _id: assessment._id,
        bookingReference: assessment.bookingReference,
        invoiceNumber: assessment.invoiceNumber,
        assessmentStatus: assessment.assessmentStatus,
        paymentStatus: assessment.paymentStatus
      }
    });
    
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({ message: 'Failed to process booking' });
  }
};
// controllers/preAssessmentControllers.js

// controllers/preAssessmentControllers.js

exports.createPreAssessment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      clientId, 
      addressId, 
      propertyType, 
      desiredCapacity, 
      roofType, 
      roofLength,      // Add this
      roofWidth,       // Add this
       systemType, // Add this
      preferredDate 
    } = req.body;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (client._id.toString() !== clientId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const address = await Address.findOne({ _id: addressId, clientId: client._id });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const bookingReference = `PA-${year}${month}${day}-${random}`;

    const preAssessment = new PreAssessment({
      clientId: client._id,
      addressId,
      propertyType,
      desiredCapacity: desiredCapacity || '',
      systemType: systemType || null, // Add this
      roofType: roofType || '',
      roofLength: roofLength ? parseFloat(roofLength) : null,      // Add this
      roofWidth: roofWidth ? parseFloat(roofWidth) : null,        // Add this
      preferredDate: new Date(preferredDate),
      paymentStatus: 'pending',
      assessmentStatus: 'pending_review',
      bookingReference,
    });

    await preAssessment.save();

    res.status(201).json({
      success: true,
      message: 'Pre-assessment booking submitted for admin approval',
      booking: {
        _id: preAssessment._id,
        bookingReference: preAssessment.bookingReference,
        assessmentFee: preAssessment.assessmentFee,
        preferredDate: preAssessment.preferredDate,
        assessmentStatus: preAssessment.assessmentStatus,
        paymentStatus: preAssessment.paymentStatus,
        roofLength: preAssessment.roofLength,    // Add this
        roofWidth: preAssessment.roofWidth       // Add this
      }
    });

  } catch (error) {
    console.error('Create pre-assessment error:', error);
    res.status(500).json({ message: 'Failed to book pre-assessment', error: error.message });
  }
};
// @desc    Submit GCash payment with proof
// @route   POST /api/pre-assessments/submit-payment
// @access  Private (Customer)
exports.submitPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { invoiceNumber, paymentMethod, paymentReference } = req.body;
    
    if (!req.file && paymentMethod === 'gcash') {
      return res.status(400).json({ message: 'Payment proof is required' });
    }

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const preAssessment = await PreAssessment.findOne({ 
      invoiceNumber, 
      clientId: client._id 
    });

    if (!preAssessment) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (paymentMethod === 'gcash') {
      // Process payment proof upload
      const processedFile = await processUpload(req, req.file, 'payment-proofs', `payment_${invoiceNumber}_${Date.now()}`);
      const fileUrl = getFileUrl(req, processedFile);

      const fileRecord = new File({
        filename: processedFile.filename,
        originalName: processedFile.originalName,
        fileType: 'payment_proof',
        mimeType: processedFile.mimeType,
        size: processedFile.size,
        url: fileUrl,
        publicId: processedFile.publicId,
        uploadedBy: userId,
        userRole: 'customer',
        relatedTo: 'pre_assessment',
        relatedId: preAssessment._id,
        metadata: {
          invoiceNumber,
          paymentMethod,
          paymentReference,
          storageType: processedFile.storageType
        }
      });

      await fileRecord.save();

      preAssessment.paymentMethod = paymentMethod;
      preAssessment.paymentReference = paymentReference;
      preAssessment.paymentProof = fileUrl;
      preAssessment.paymentProofFileId = fileRecord._id;
      preAssessment.paymentStatus = 'for_verification';
      
    } else if (paymentMethod === 'cash') {
      preAssessment.paymentMethod = 'cash';
      preAssessment.paymentStatus = 'pending';
    }

    await preAssessment.save();

    res.json({
      success: true,
      message: paymentMethod === 'gcash' ? 'Payment submitted for verification' : 'Cash payment selected'
    });

  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ message: 'Failed to submit payment' });
  }
};
// @desc    Submit payment proof (GCash) with Cloudinary storage
// @route   POST /api/pre-assessments/payment
// @access  Private (Customer)
exports.submitPaymentProof = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingReference, paymentMethod, paymentReference } = req.body;
    
    if (!req.file) {
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

    const processedFile = await processUpload(
      req, 
      req.file, 
      'payment-proofs', 
      `payment_${bookingReference}_${Date.now()}`
    );

    if (!processedFile) {
      return res.status(500).json({ message: 'Failed to process file upload' });
    }

    const fileUrl = getFileUrl(req, processedFile);

    const fileRecord = new File({
      filename: processedFile.filename,
      originalName: processedFile.originalName,
      fileType: 'payment_proof',
      mimeType: processedFile.mimeType,
      size: processedFile.size,
      url: fileUrl,
      publicId: processedFile.publicId,
      uploadedBy: userId,
      userRole: 'customer',
      relatedTo: 'pre_assessment',
      relatedId: preAssessment._id,
      metadata: {
        bookingReference,
        paymentMethod,
        paymentReference,
        storageType: processedFile.storageType
      }
    });

    await fileRecord.save();

    preAssessment.paymentMethod = paymentMethod;
    preAssessment.paymentReference = paymentReference;
    preAssessment.paymentProof = fileUrl;
    preAssessment.paymentProofFileId = fileRecord._id;
    preAssessment.paymentStatus = 'for_verification';
    preAssessment.assessmentStatus = 'scheduled';

    await preAssessment.save();

    res.json({
      success: true,
      message: 'Payment proof submitted successfully. Please wait for verification.',
      file: {
        id: fileRecord._id,
        url: fileRecord.url,
        filename: fileRecord.originalName,
        storageType: processedFile.storageType
      },
      booking: {
        bookingReference: preAssessment.bookingReference,
        assessmentStatus: preAssessment.assessmentStatus,
        paymentStatus: preAssessment.paymentStatus
      }
    });

  } catch (error) {
    console.error('Submit payment error:', error);
    if (req.file) {
      try {
        await deleteFromStorage(null, null, null);
      } catch (deleteError) {
        console.error('Error deleting file:', deleteError);
      }
    }
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
// controllers/preAssessmentControllers.js

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
      preAssessment.assessmentStatus = 'scheduled'; // Set assessment status to scheduled when payment is verified
      preAssessment.confirmedAt = new Date();
      
      if (preAssessment.paymentProofFileId) {
        await File.findByIdAndUpdate(preAssessment.paymentProofFileId, {
          'metadata.verified': true,
          'metadata.verifiedBy': req.user.id,
          'metadata.verifiedAt': new Date(),
          'metadata.adminNotes': notes
        });
      }
    } else {
      preAssessment.paymentStatus = 'failed';
      preAssessment.assessmentStatus = 'cancelled'; // Set assessment status to cancelled when payment is rejected
      
      if (preAssessment.paymentProofFileId) {
        const fileRecord = await File.findById(preAssessment.paymentProofFileId);
        if (fileRecord) {
          await deleteFromStorage(fileRecord.publicId);
          await fileRecord.deleteOne();
        }
      }
    }

    preAssessment.adminRemarks = notes;
    await preAssessment.save();

    res.json({
      success: true,
      message: verified ? 'Payment verified successfully' : 'Payment verification failed',
      booking: {
        _id: preAssessment._id,
        bookingReference: preAssessment.bookingReference,
        invoiceNumber: preAssessment.invoiceNumber,
        paymentStatus: preAssessment.paymentStatus,
        assessmentStatus: preAssessment.assessmentStatus // Include assessment status in response
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};
// ============ ENGINEER ASSESSMENT FUNCTIONS ============

// In preAssessmentControllers.js, update the getEngineerAssessments function:
// Add to preAssessmentControllers.js

// @desc    Analyze IoT data and generate recommendations
// @route   POST /api/pre-assessments/:id/analyze-iot-data
// @access  Private (Engineer)
exports.analyzeIoTData = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Fetch sensor data
    const sensorData = await SensorData.find({ 
      preAssessmentId: assessment._id 
    }).sort({ timestamp: 1 });

    if (sensorData.length === 0) {
      return res.status(400).json({ message: 'No sensor data available for analysis' });
    }

    // Calculate statistics
    const irradianceValues = sensorData.map(d => d.irradiance || 0).filter(v => v > 0);
    const temperatureValues = sensorData.map(d => d.temperature || 0);
    const humidityValues = sensorData.map(d => d.humidity || 0);
    
    const averageIrradiance = irradianceValues.reduce((a, b) => a + b, 0) / irradianceValues.length;
    const maxIrradiance = Math.max(...irradianceValues);
    const peakSunHours = (irradianceValues.reduce((a, b) => a + b, 0) / 1000).toFixed(1);
    
    const averageTemperature = temperatureValues.reduce((a, b) => a + b, 0) / temperatureValues.length;
    const minTemperature = Math.min(...temperatureValues);
    const maxTemperature = Math.max(...temperatureValues);
    const efficiencyLoss = ((averageTemperature - 25) * 0.004 * 100).toFixed(1);
    
    const averageHumidity = humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length;
    const minHumidity = Math.min(...humidityValues);
    const maxHumidity = Math.max(...humidityValues);
    
    // Calculate recommended system size based on irradiance
    const recommendedSystemSize = (peakSunHours * 0.8).toFixed(1);
    
    // Determine optimal orientation based on time of day analysis
    const hourData = {};
    sensorData.forEach(d => {
      const hour = new Date(d.timestamp).getHours();
      if (!hourData[hour]) hourData[hour] = [];
      hourData[hour].push(d.irradiance || 0);
    });
    
    let peakHour = 12;
    let maxIrradianceAtHour = 0;
    for (const [hour, values] of Object.entries(hourData)) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      if (avg > maxIrradianceAtHour) {
        maxIrradianceAtHour = avg;
        peakHour = parseInt(hour);
      }
    }
    
    const recommendedOrientation = peakHour < 12 ? 'East-facing' : 
                                    peakHour > 12 ? 'West-facing' : 'South-facing';
    const recommendedTiltAngle = Math.min(45, Math.max(10, Math.floor(peakSunHours * 3)));
    
    // Calculate shading percentage
    const shadingPercentage = ((irradianceValues.filter(v => v < 200).length / irradianceValues.length) * 100).toFixed(1);
    
    const analysisResults = {
      averageIrradiance,
      maxIrradiance,
      peakSunHours: parseFloat(peakSunHours),
      averageTemperature,
      minTemperature,
      maxTemperature,
      efficiencyLoss: parseFloat(efficiencyLoss),
      averageHumidity,
      minHumidity,
      maxHumidity,
      recommendedSystemSize: parseFloat(recommendedSystemSize),
      recommendedOrientation,
      recommendedTiltAngle,
      shadingPercentage: parseFloat(shadingPercentage),
      totalReadings: sensorData.length,
      dataCollectionStart: assessment.dataCollectionStart,
      dataCollectionEnd: assessment.dataCollectionEnd
    };
    
    // Store analysis in assessment
    assessment.assessmentResults = {
      totalIrradiance: irradianceValues.reduce((a, b) => a + b, 0),
      averageTemperature,
      shadingPercentage: parseFloat(shadingPercentage),
      recommendedPanelCount: Math.ceil(recommendedSystemSize * 1000 / 400), // Assuming 400W panels
      estimatedSystemSize: recommendedSystemSize,
      structuralAssessment: assessment.engineerAssessment?.structuralIntegrity || 'Pending',
      electricalAssessment: 'Based on site inspection',
      safetyAssessment: 'Standard safety protocols applicable'
    };
    
    await assessment.save();
    
    res.json({
      success: true,
      message: 'IoT data analysis completed',
      analysis: analysisResults
    });
    
  } catch (error) {
    console.error('Analyze IoT data error:', error);
    res.status(500).json({ message: 'Failed to analyze IoT data', error: error.message });
  }
};
exports.getEngineerAssessments = async (req, res) => {
  try {
    const engineerId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { 
      assignedEngineerId: engineerId,
      assessmentStatus: { $nin: ['cancelled', 'pending_payment'] }
    };
    
    if (status) query.assessmentStatus = status;

    const assessments = await PreAssessment.find(query)
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId.email')
      .populate('addressId')
      .populate('iotDeviceId')  // Add this to populate device data
      .sort({ siteVisitDate: -1, bookedAt: -1 })
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
    console.error('Get engineer assessments error:', error);
    res.status(500).json({ message: 'Failed to fetch assessments', error: error.message });
  }
};

// @desc    Start site assessment (Engineer)
// @route   POST /api/pre-assessments/:id/start-assessment
// @access  Private (Engineer)
exports.startAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
    const { notes } = req.body;

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized for this assessment' });
    }

    if (assessment.assessmentStatus !== 'scheduled') {
      return res.status(400).json({ message: 'Assessment not ready for site visit' });
    }

    assessment.assessmentStatus = 'site_visit_ongoing';
    assessment.engineerAssessment = {
      ...assessment.engineerAssessment,
      siteInspectionDate: new Date(),
      inspectionNotes: notes
    };

    if (!assessment.engineerComments) assessment.engineerComments = [];
    assessment.engineerComments.push({
      comment: `Started site assessment: ${notes || 'No initial notes'}`,
      commentedBy: engineerId,
      commentedAt: new Date(),
      isPublic: false
    });

    await assessment.save();

    res.json({
      success: true,
      message: 'Site assessment started',
      assessment
    });

  } catch (error) {
    console.error('Start assessment error:', error);
    res.status(500).json({ message: 'Failed to start assessment', error: error.message });
  }
};

// controllers/preAssessmentControllers.js

// @desc    Update site assessment details (Engineer)
// @route   PUT /api/pre-assessments/:id/update-assessment
// @access  Private (Engineer)
exports.updateSiteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
    const {
      roofCondition,
      roofLength,                    // Add this
      roofWidth,                     // Add this
      structuralIntegrity,
      shadingAnalysis,
      recommendedPanelPlacement,
      estimatedInstallationTime,
      additionalMaterials,
      safetyConsiderations,
      recommendations,
      technicalFindings
    } = req.body;

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized for this assessment' });
    }

    if (!assessment.engineerAssessment) assessment.engineerAssessment = {};
    
    assessment.engineerAssessment.roofCondition = roofCondition;
    assessment.engineerAssessment.roofLength = roofLength ? parseFloat(roofLength) : null;        // Add this
    assessment.engineerAssessment.roofWidth = roofWidth ? parseFloat(roofWidth) : null;          // Add this
    assessment.engineerAssessment.structuralIntegrity = structuralIntegrity;
    assessment.engineerAssessment.shadingAnalysis = shadingAnalysis;
    assessment.engineerAssessment.recommendedPanelPlacement = recommendedPanelPlacement;
    assessment.engineerAssessment.estimatedInstallationTime = estimatedInstallationTime;
    assessment.engineerAssessment.additionalMaterials = additionalMaterials;
    assessment.engineerAssessment.safetyConsiderations = safetyConsiderations;
    assessment.engineerAssessment.recommendations = recommendations;
    assessment.technicalFindings = technicalFindings;

    await assessment.save();

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      assessment
    });

  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ message: 'Failed to update assessment', error: error.message });
  }
};

// @desc    Upload quotation PDF (Engineer)
// @route   POST /api/pre-assessments/:id/upload-quotation
// @access  Private (Engineer)
exports.uploadQuotationPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
    const { 
      quotationNumber, 
      quotationExpiryDate,
      systemSize,
      systemType,
      panelsNeeded,
      inverterType,
      batteryType,
      installationCost,
      equipmentCost,
      totalCost,
      paymentTerms,
      warrantyYears
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Quotation PDF is required' });
    }

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized for this assessment' });
    }

    // Process the uploaded PDF
    const processedFile = await processUpload(
      req,
      req.file,
      'quotations',
      `quotation_${assessment.bookingReference}_${Date.now()}`
    );

    if (!processedFile) {
      return res.status(500).json({ message: 'Failed to process file upload' });
    }

    const fileUrl = getFileUrl(req, processedFile);

    // Save file record
    const fileRecord = new File({
      filename: processedFile.filename,
      originalName: processedFile.originalName,
      fileType: 'quotation_pdf',
      mimeType: processedFile.mimeType,
      size: processedFile.size,
      url: fileUrl,
      publicId: processedFile.publicId,
      uploadedBy: engineerId,
      userRole: 'engineer',
      relatedTo: 'pre_assessment',
      relatedId: assessment._id,
      metadata: {
        quotationNumber,
        documentType: 'quotation_pdf',
        storageType: processedFile.storageType
      }
    });

    await fileRecord.save();

    // Add to assessment documents
    if (!assessment.assessmentDocuments) assessment.assessmentDocuments = [];
    assessment.assessmentDocuments.push({
      fileId: fileRecord._id,
      documentType: 'quotation_pdf',
      description: `Quotation ${quotationNumber || 'PDF'}`,
      uploadedAt: new Date()
    });

    // Update quotation details
    assessment.quotation = {
      quotationFileId: fileRecord._id,
      quotationUrl: fileUrl,
      quotationNumber: quotationNumber || `Q-${assessment.bookingReference}`,
      quotationDate: new Date(),
      quotationExpiryDate: quotationExpiryDate ? new Date(quotationExpiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      systemDetails: {
        systemSize: parseFloat(systemSize) || assessment.finalSystemSize,
        systemType: systemType || assessment.recommendedSystemType,
        panelsNeeded: parseInt(panelsNeeded) || assessment.panelsNeeded,
        inverterType,
        batteryType,
        installationCost: parseFloat(installationCost) || 0,
        equipmentCost: parseFloat(equipmentCost) || 0,
        totalCost: parseFloat(totalCost) || 0,
        paymentTerms,
        warrantyYears: parseInt(warrantyYears) || 10
      },
      generatedAt: new Date(),
      generatedBy: engineerId
    };

    // Update final quotation field
    assessment.finalQuotation = fileUrl;
    assessment.assessmentStatus = 'report_draft';

    await assessment.save();

    res.json({
      success: true,
      message: 'Quotation PDF uploaded successfully',
      quotation: {
        id: fileRecord._id,
        url: fileRecord.url,
        quotationNumber: assessment.quotation.quotationNumber,
        totalCost: assessment.quotation.systemDetails.totalCost,
        expiryDate: assessment.quotation.quotationExpiryDate
      }
    });

  } catch (error) {
    console.error('Upload quotation error:', error);
    if (req.file) {
      await deleteFromStorage(null, null, null);
    }
    res.status(500).json({ message: 'Failed to upload quotation', error: error.message });
  }
};

// @desc    Submit final assessment report with quotation (Engineer)
// @route   POST /api/pre-assessments/:id/submit-report
// @access  Private (Engineer)
exports.submitAssessmentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
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
      quotationId
    } = req.body;

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized for this assessment' });
    }

    // Update assessment with final results
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

    // Update status
    assessment.assessmentStatus = 'completed';
    assessment.completedAt = new Date();

    await assessment.save();

    // Add engineer comment
    if (!assessment.engineerComments) assessment.engineerComments = [];
    assessment.engineerComments.push({
      comment: 'Final assessment report submitted with quotation',
      commentedBy: engineerId,
      commentedAt: new Date(),
      isPublic: false
    });

    await assessment.save();

    res.json({
      success: true,
      message: 'Final report submitted successfully',
      assessment: {
        id: assessment._id,
        bookingReference: assessment.bookingReference,
        assessmentStatus: assessment.assessmentStatus,
        finalSystemSize: assessment.finalSystemSize,
        finalSystemCost: assessment.finalSystemCost,
        quotation: assessment.quotation
      }
    });

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Failed to submit report', error: error.message });
  }
};

// @desc    Get assessment documents (including quotation PDF)
// @route   GET /api/pre-assessments/:id/documents
// @access  Private (Engineer, Admin, Customer)
exports.getAssessmentDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType } = req.query;

    const query = {
      relatedTo: 'pre_assessment',
      relatedId: id,
      fileType: { $in: ['quotation_pdf', 'assessment_document'] },
      isActive: true
    };

    if (documentType) query['metadata.documentType'] = documentType;

    const documents = await File.find(query)
      .populate('uploadedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      documents
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};

// @desc    Add engineer comment
// @route   POST /api/pre-assessments/:id/add-comment
// @access  Private (Engineer, Admin)
exports.addEngineerComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { comment, isPublic = true } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (!assessment.engineerComments) assessment.engineerComments = [];

    assessment.engineerComments.push({
      comment,
      commentedBy: userId,
      commentedAt: new Date(),
      isPublic
    });

    await assessment.save();

    // Populate user info
    await assessment.populate('engineerComments.commentedBy', 'firstName lastName email role');

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: assessment.engineerComments[assessment.engineerComments.length - 1]
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// @desc    Get assessment comments
// @route   GET /api/pre-assessments/:id/comments
// @access  Private (Engineer, Admin, Customer)
exports.getAssessmentComments = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const assessment = await PreAssessment.findById(id)
      .populate('engineerComments.commentedBy', 'firstName lastName email role');

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    let comments = assessment.engineerComments || [];
    if (userRole === 'customer') {
      comments = comments.filter(comment => comment.isPublic === true);
    }

    res.json({
      success: true,
      comments
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

// ============ EXISTING FUNCTIONS ============

// @desc    Get payment history for customer
// @route   GET /api/pre-assessments/payments
// @access  Private (Customer)
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const assessments = await PreAssessment.find({ 
      clientId: client._id,
      paymentStatus: { $in: ['paid', 'for_verification'] }
    }).sort({ confirmedAt: -1 });

    const payments = assessments.map(assessment => ({
      id: assessment._id,
      date: assessment.confirmedAt || assessment.bookedAt,
      amount: assessment.assessmentFee,
      method: assessment.paymentMethod || 'Cash',
      invoiceId: assessment.invoiceNumber,
      status: assessment.paymentStatus === 'paid' ? 'completed' : 'pending'
    }));

    res.json({
      success: true,
      payments
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Failed to fetch payment history', error: error.message });
  }
};

// @desc    Get pre-assessment stats for admin dashboard
// @route   GET /api/pre-assessments/stats
// @access  Private (Admin)
exports.getPreAssessmentStats = async (req, res) => {
  try {
    const total = await PreAssessment.countDocuments();
    const pending = await PreAssessment.countDocuments({ paymentStatus: 'pending' });
    const forVerification = await PreAssessment.countDocuments({ paymentStatus: 'for_verification' });
    const paid = await PreAssessment.countDocuments({ paymentStatus: 'paid' });
    const failed = await PreAssessment.countDocuments({ paymentStatus: 'failed' });
    
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
    
    const monthlyStats = await PreAssessment.aggregate([
      {
        $match: {
          bookedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$bookedAt' } },
          total: { $sum: 1 },
          paid: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
          },
          forVerification: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'for_verification'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const revenueResult = await PreAssessment.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$assessmentFee' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const pendingResult = await PreAssessment.aggregate([
      { $match: { paymentStatus: { $in: ['pending', 'for_verification'] } } },
      { $group: { _id: null, total: { $sum: '$assessmentFee' } } }
    ]);
    const pendingRevenue = pendingResult[0]?.total || 0;

    res.json({
      success: true,
      total,
      pending,
      forVerification,
      paid,
      failed,
      totalRevenue,
      pendingRevenue,
      monthlyStats
    });

  } catch (error) {
    console.error('Get pre-assessment stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
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

// controllers/preAssessmentControllers.js

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
      .populate('quotation.quotationFileId')
      .populate('')
      .sort({ bookedAt: -1 });

    // Format the response to include all necessary fields
    const formattedAssessments = assessments.map(assessment => ({
      _id: assessment._id,
      bookingReference: assessment.bookingReference,
      invoiceNumber: assessment.invoiceNumber, // Include invoice number
      assessmentStatus: assessment.assessmentStatus,
      paymentStatus: assessment.paymentStatus,
      assessmentFee: assessment.assessmentFee,
      propertyType: assessment.propertyType,
      desiredCapacity: assessment.desiredCapacity,
      roofType: assessment.roofType,
      preferredDate: assessment.preferredDate,
      bookedAt: assessment.bookedAt,
      address: assessment.addressId,
      iotDeviceId: assessment.iotDeviceId,
      paymentMethod: assessment.paymentMethod,
      paymentProof: assessment.paymentProof,
      paymentReference: assessment.paymentReference,
      quotation: assessment.quotation,
      finalQuotation: assessment.finalQuotation,
      quotationUrl: assessment.quotation?.quotationUrl || assessment.finalQuotation
    }));

    res.json({
      success: true,
      assessments: formattedAssessments
    });

  } catch (error) {
    console.error('Get my pre-assessments error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
};
// @desc    Update payment status (Admin only)
// @route   PUT /api/pre-assessments/:id/update-payment-status
// @access  Private (Admin)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, assessmentStatus, notes } = req.body;
    
    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    assessment.paymentStatus = paymentStatus;
    assessment.assessmentStatus = assessmentStatus;
    if (notes) assessment.adminRemarks = notes;
    assessment.confirmedAt = paymentStatus === 'paid' ? new Date() : assessment.confirmedAt;
    
    await assessment.save();
    
    res.json({
      success: true,
      message: 'Payment status updated successfully',
      assessment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Failed to update payment status' });
  }
};
// @desc    Engineer deploys device on site (Engineer only)
// @route   POST /api/pre-assessments/:id/deploy-device
// @access  Private (Engineer)
exports.deployDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const engineerId = req.user.id;

    console.log('Engineer deploy device request:', { id, engineerId });

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Check if engineer is assigned to this assessment
    if (assessment.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized for this assessment' });
    }

    // Check if device is assigned - check both possible fields
    const deviceId = assessment.assignedDeviceId || assessment.iotDeviceId;
    
    if (!deviceId) {
      return res.status(400).json({ 
        message: 'No device assigned to this assessment. Please contact admin.' 
      });
    }

    // Find the device
    const device = await IoTDevice.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Assigned device not found' });
    }

    console.log('Current device status:', device.status);
    console.log('Current assessment status:', assessment.assessmentStatus);

    // Check if device is already deployed
    if (device.status === 'deployed' || device.status === 'data_collecting') {
      // If already deployed, just update the assessment if needed
      if (assessment.assessmentStatus !== 'device_deployed') {
        assessment.assessmentStatus = 'device_deployed';
        assessment.deviceDeployedAt = new Date();
        assessment.deviceDeployedBy = engineerId;
        assessment.dataCollectionStart = new Date();
        await assessment.save();
      }
      return res.json({
        success: true,
        message: 'Device is already deployed',
        assessment: {
          id: assessment._id,
          bookingReference: assessment.bookingReference,
          assessmentStatus: assessment.assessmentStatus
        },
        device: {
          id: device._id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          status: device.status
        }
      });
    }

    // Check if device is in assigned status
    if (device.status !== 'assigned') {
      // If device is available, we need to update it to assigned first
      if (device.status === 'available') {
        console.log('Device is available, updating to assigned first...');
        device.status = 'assigned';
        device.assignedToEngineerId = engineerId;
        device.assignedToPreAssessmentId = assessment._id;
        device.assignedAt = new Date();
        await device.save();
      } else {
        return res.status(400).json({ 
          message: `Device is not ready for deployment. Current status: ${device.status}. Device must be 'assigned' first.` 
        });
      }
    }

    // Engineer deploys device on site
    device.status = 'deployed';
    device.deployedAt = new Date();
    device.deployedBy = engineerId;
    device.deploymentNotes = notes || 'Device deployed on site';
    
    // Update deployment history
    if (device.deploymentHistory && device.deploymentHistory.length > 0) {
      const lastDeployment = device.deploymentHistory[device.deploymentHistory.length - 1];
      if (lastDeployment) {
        lastDeployment.deployedAt = new Date();
        lastDeployment.deployedBy = engineerId;
        lastDeployment.notes = notes;
      }
    } else {
      // If no deployment history, create one
      device.deploymentHistory = [{
        preAssessmentId: assessment._id,
        assignedAt: device.assignedAt || new Date(),
        assignedBy: device.assignedBy,
        deployedAt: new Date(),
        deployedBy: engineerId,
        notes: notes
      }];
    }
    
    await device.save();
    console.log('✅ Device status updated to: deployed');

    // Update assessment
    assessment.iotDeviceId = device._id;
    assessment.assignedDeviceId = device._id;
    assessment.deviceDeployedAt = new Date();
    assessment.deviceDeployedBy = engineerId;
    assessment.dataCollectionStart = new Date();
    assessment.assessmentStatus = 'device_deployed';
    await assessment.save();

    res.json({
      success: true,
      message: 'Device deployed successfully on site',
      assessment: {
        id: assessment._id,
        bookingReference: assessment.bookingReference,
        assessmentStatus: assessment.assessmentStatus,
        dataCollectionStart: assessment.dataCollectionStart
      },
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        status: device.status
      }
    });

  } catch (error) {
    console.error('Deploy device error:', error);
    res.status(500).json({ message: 'Failed to deploy device', error: error.message });
  }
};

// @desc    Engineer retrieves device after 7 days (Engineer only)
// @route   POST /api/pre-assessments/:id/retrieve-device
// @access  Private (Engineer)
exports.retrieveDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const engineerId = req.user.id;

    console.log('Engineer retrieve device request:', { id, engineerId });

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Check if engineer is assigned
    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized for this assessment' });
    }

    // Check if device is deployed
    if (assessment.assessmentStatus !== 'device_deployed' && assessment.assessmentStatus !== 'data_collecting') {
      return res.status(400).json({ 
        message: `No device deployed to retrieve. Current status: ${assessment.assessmentStatus}` 
      });
    }

    // Find the device
    const device = await IoTDevice.findById(assessment.iotDeviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Engineer retrieves device
    device.status = 'available';
    device.retrievedAt = new Date();
    device.retrievedBy = engineerId;
    device.retrievalNotes = notes;
    
    // Clear assignment
    device.assignedToEngineerId = null;
    device.assignedToPreAssessmentId = null;
    
    // Update deployment history
    if (device.deploymentHistory.length > 0) {
      const lastDeployment = device.deploymentHistory[device.deploymentHistory.length - 1];
      lastDeployment.retrievedAt = new Date();
      lastDeployment.retrievedBy = engineerId;
      lastDeployment.notes = notes;
    }
    
    await device.save();

    // Update assessment
    assessment.deviceRetrievedAt = new Date();
    assessment.deviceRetrievedBy = engineerId;
    assessment.dataCollectionEnd = new Date();
    assessment.assessmentStatus = 'data_analyzing';
    await assessment.save();

    res.json({
      success: true,
      message: 'Device retrieved successfully after data collection',
      assessment: {
        id: assessment._id,
        bookingReference: assessment.bookingReference,
        assessmentStatus: assessment.assessmentStatus,
        totalReadings: assessment.totalReadings || 0,
        dataCollectionDays: Math.ceil((assessment.dataCollectionEnd - assessment.dataCollectionStart) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    console.error('Retrieve device error:', error);
    res.status(500).json({ message: 'Failed to retrieve device', error: error.message });
  }
};
// Add this to preAssessmentControllers.js
exports.uploadSiteImages = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    
    const imageUrls = [];
    // Process each image upload to Cloudinary/local storage
    
    const assessment = await PreAssessment.findById(id);
    if (!assessment.sitePhotos) assessment.sitePhotos = [];
    assessment.sitePhotos.push(...imageUrls);
    await assessment.save();
    
    res.json({ success: true, images: imageUrls });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      .populate('deviceRetrievedBy', 'firstName lastName')
      .populate('quotation.generatedBy', 'firstName lastName email');

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

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

// @desc    Get IoT data for engineer (read-only)
// @route   GET /api/pre-assessments/:id/iot-data
// @access  Private (Engineer)
exports.getIoTData = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Check if engineer is assigned to this assessment
    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized to view this data' });
    }

    // Get IoT data
    const sensorData = await SensorData.find({ preAssessmentId: assessment._id })
      .sort({ timestamp: -1 })
      .limit(1000);

    // Get statistics
    const stats = {
      totalReadings: assessment.totalReadings || 0,
      dataCollectionStart: assessment.dataCollectionStart,
      dataCollectionEnd: assessment.dataCollectionEnd,
      averageVoltage: 0,
      averageCurrent: 0,
      averagePower: 0,
      maxPower: 0,
      averageTemperature: 0
    };

    if (sensorData.length > 0) {
      stats.averageVoltage = sensorData.reduce((sum, d) => sum + (d.voltage || 0), 0) / sensorData.length;
      stats.averageCurrent = sensorData.reduce((sum, d) => sum + (d.current || 0), 0) / sensorData.length;
      stats.averagePower = sensorData.reduce((sum, d) => sum + (d.power || 0), 0) / sensorData.length;
      stats.maxPower = Math.max(...sensorData.map(d => d.power || 0));
      stats.averageTemperature = sensorData.reduce((sum, d) => sum + (d.temperature || 0), 0) / sensorData.length;
    }

    res.json({
      success: true,
      readings: sensorData,
      stats
    });

  } catch (error) {
    console.error('Get IoT data error:', error);
    res.status(500).json({ message: 'Failed to fetch IoT data', error: error.message });
  }
};

// module.exports = {
//   createPreAssessment,
//   submitPaymentProof,
//   cashPayment,
//   verifyPayment,
//   getPaymentHistory,
//   getPreAssessmentStats,
//   getAllPreAssessments,
//   getMyPreAssessments,
//   getPreAssessmentById,
//   assignEngineer,
//   cancelPreAssessment,
//   // Engineer assessment functions
//   getEngineerAssessments,
//   startAssessment,
//   updateSiteAssessment,
//   uploadQuotationPDF,
//   submitAssessmentReport,
//   getAssessmentDocuments,
//   addEngineerComment,
//   getAssessmentComments
// };