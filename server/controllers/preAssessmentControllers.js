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
const PayMongoService = require('../services/paymongoService');
const receiptService = require('../services/receiptService');

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


// @desc    Create PayMongo payment intent for pre-assessment
// @route   POST /api/pre-assessments/:id/create-payment-intent
// @access  Private (Customer)
exports.createPayMongoPaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { paymentMethod } = req.body;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const assessment = await PreAssessment.findOne({
      _id: id,
      clientId: client._id
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    const paymentIntent = await PayMongoService.createPaymentIntent(
      assessment.assessmentFee,
      `Pre-Assessment Fee - ${assessment.bookingReference}`,
      {
        type: 'pre_assessment',
        preAssessmentId: assessment._id.toString(),
        bookingReference: assessment.bookingReference,
        clientId: client._id.toString(),
        clientName: `${client.contactFirstName} ${client.contactLastName}`
      }
    );

    if (!paymentIntent.success) {
      return res.status(500).json({ message: paymentIntent.error });
    }

    assessment.paymongoPaymentIntentId = paymentIntent.paymentIntentId;
    assessment.paymentGateway = 'paymongo';
    await assessment.save();

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
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
  }
};
// @desc    Get PayMongo payment status
// @route   GET /api/pre-assessments/paymongo-status/:paymentIntentId
// @access  Private (Customer)
exports.getPayMongoPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await PayMongoService.getPaymentIntent(paymentIntentId);

    if (!paymentIntent.success) {
      return res.status(500).json({ message: paymentIntent.error });
    }

    res.json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      paidAt: paymentIntent.paidAt
    });

  } catch (error) {
    console.error('Get PayMongo payment status error:', error);
    res.status(500).json({ message: 'Failed to get payment status', error: error.message });
  }
};
// @desc    Verify PayMongo payment after redirect
// @route   POST /api/pre-assessments/verify-paymongo-payment
// @access  Private (Customer)
exports.verifyPayMongoPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const assessment = await PreAssessment.findOne({
      paymongoPaymentIntentId: paymentIntentId,
      clientId: client._id
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
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

    assessment.paymentStatus = 'paid';
    assessment.assessmentStatus = 'scheduled';
    assessment.paymentMethod = 'paymongo';
    assessment.paymentGateway = 'paymongo';
    assessment.autoVerified = true;
    assessment.paymentCompletedAt = new Date();
    assessment.confirmedAt = new Date();
    await assessment.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      booking: {
        bookingReference: assessment.bookingReference,
        invoiceNumber: assessment.invoiceNumber,
        assessmentStatus: assessment.assessmentStatus
      }
    });

  } catch (error) {
    console.error('Verify PayMongo payment error:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};
// @desc    Generate Quotation PDF for Pre-Assessment (ENHANCED with ALL equipment)
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
      panelType,
      inverterType,
      batteryType,
      installationCost,
      equipmentCost,
      totalCost,
      paymentTerms,
      warrantyYears,
      includeIoTData,
      iotData,  // IoT data from frontend
      equipmentDetails  // Detailed equipment breakdown
    } = req.body;

    const assessment = await PreAssessment.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId')
      .populate('addressId');

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Use IoT data from frontend if provided, otherwise fetch from database
    let iotAnalysis = iotData || null;

    if (includeIoTData && !iotAnalysis && assessment.dataCollectionEnd) {
      const device = await IoTDevice.findOne({ deviceId: assessment.iotDeviceId?.deviceId });
      if (device) {
        const sensorData = await SensorData.find({ deviceId: device.deviceId });
        if (sensorData.length > 0) {
          const irradianceValues = sensorData.map(d => d.irradiance || 0).filter(v => v > 0);
          const temperatureValues = sensorData.map(d => d.temperature || 0).filter(t => t && t > 0);
          const humidityValues = sensorData.map(d => d.humidity || 0).filter(h => h && h > 0);

          // Calculate min/max properly - exclude zeros
          const minIrradiance = irradianceValues.length > 0 ? Math.min(...irradianceValues) : 0;
          const maxIrradiance = irradianceValues.length > 0 ? Math.max(...irradianceValues) : 0;
          const avgIrradiance = irradianceValues.length > 0
            ? irradianceValues.reduce((a, b) => a + b, 0) / irradianceValues.length
            : 0;

          const minTemperature = temperatureValues.length > 0 ? Math.min(...temperatureValues) : 0;
          const maxTemperature = temperatureValues.length > 0 ? Math.max(...temperatureValues) : 0;
          const avgTemperature = temperatureValues.length > 0
            ? temperatureValues.reduce((a, b) => a + b, 0) / temperatureValues.length
            : 0;

          const minHumidity = humidityValues.length > 0 ? Math.min(...humidityValues) : 0;
          const maxHumidity = humidityValues.length > 0 ? Math.max(...humidityValues) : 0;
          const avgHumidity = humidityValues.length > 0
            ? humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length
            : 0;

          // Calculate peak sun hours correctly
          let totalPSH = 0;
          for (let i = 0; i < sensorData.length - 1; i++) {
            const timeDiff = (new Date(sensorData[i + 1].timestamp) - new Date(sensorData[i].timestamp)) / (1000 * 60 * 60);
            const avgReading = (sensorData[i].irradiance + sensorData[i + 1].irradiance) / 2;
            if (avgReading > 10) {
              totalPSH += (avgReading / 1000) * timeDiff;
            }
          }
          const peakSunHours = totalPSH > 0 ? totalPSH.toFixed(1) : 4.5;

          iotAnalysis = {
            totalReadings: sensorData.length,
            // Irradiance metrics
            averageIrradiance: avgIrradiance,
            maxIrradiance: maxIrradiance,
            minIrradiance: minIrradiance,  // ✅ ADDED
            peakSunHours: peakSunHours,
            // Temperature metrics
            averageTemperature: avgTemperature,
            minTemperature: minTemperature,  // ✅ ADDED
            maxTemperature: maxTemperature,
            // Humidity metrics
            averageHumidity: avgHumidity,
            minHumidity: minHumidity,  // ✅ ADDED
            maxHumidity: maxHumidity,
            // System recommendations
            recommendedSystemSize: ((avgIrradiance / 1000) * 0.8).toFixed(1),
            optimalOrientation: iotData?.optimalOrientation || 'South-facing',
            optimalTiltAngle: iotData?.optimalTiltAngle || 15,
            estimatedMonthlySavings: iotData?.estimatedMonthlySavings || 0,
            paybackPeriod: iotData?.paybackPeriod || 0,
            co2Offset: iotData?.co2Offset || 0,
            annualProduction: iotData?.estimatedAnnualProduction || 0,
            siteSuitabilityScore: iotData?.siteSuitabilityScore || 85
          };
        }
      }
    }

    // If we have IoT data from the frontend (assessmentResults), make sure it has all fields
    if (iotData && !iotAnalysis?.minIrradiance) {
      iotAnalysis = {
        ...iotData,
        minIrradiance: iotData.minIrradiance || 0,
        maxIrradiance: iotData.maxIrradiance || 0,
        averageIrradiance: iotData.averageIrradiance || 0,
        minTemperature: iotData.minTemperature || 0,
        maxTemperature: iotData.maxTemperature || 0,
        averageTemperature: iotData.averageTemperature || 0,
        minHumidity: iotData.minHumidity || 0,
        maxHumidity: iotData.maxHumidity || 0,
        averageHumidity: iotData.averageHumidity || 0,
        peakSunHours: iotData.peakSunHours || 4.5,
        recommendedSystemSize: iotData.recommendedSystemSize || systemSize || 5,
        optimalOrientation: iotData.optimalOrientation || 'South-facing',
        optimalTiltAngle: iotData.optimalTiltAngle || 15,
        siteSuitabilityScore: iotData.siteSuitabilityScore || 85
      };
    }

    // Prepare ENHANCED cost breakdown with ALL equipment types
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

    // Calculate totals
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

    // Prepare data for PDF with IoT metrics
    const pdfData = {
      bookingReference: assessment.bookingReference,
      clientName: `${assessment.clientId.contactFirstName} ${assessment.clientId.contactLastName}`,
      clientPhone: assessment.clientId.contactNumber,
      clientEmail: assessment.clientId.userId?.email,
      propertyType: assessment.propertyType,
      address: assessment.addressId ?
        `${assessment.addressId.houseOrBuilding} ${assessment.addressId.street}, ${assessment.addressId.barangay}, ${assessment.addressId.cityMunicipality}` : null,
      quotationNumber: quotationNumber || `Q-${assessment.bookingReference}`,
      quotationExpiryDate: quotationExpiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      systemSize: parseFloat(systemSize),
      systemTypeLabel: SYSTEM_TYPES.find(t => t.value === systemType)?.label || systemType,
      panelsNeeded: equipmentDetails?.panelQuantity || parseInt(panelsNeeded) || 0,
      panelType: equipmentDetails?.panel?.name || panelType,
      inverterType: equipmentDetails?.inverter?.name || inverterType,
      batteryType: equipmentDetails?.battery?.name || batteryType,
      warrantyYears: parseInt(warrantyYears) || 10,
      paymentTerms: paymentTerms || '',
      costBreakdown,
      calculatedEquipmentTotal,
      calculatedInstallationTotal,
      calculatedTotalCost,
      iotAnalysis,  // Now includes min/max fields
      siteAssessment: {
        roofCondition: assessment.engineerAssessment?.roofCondition,
        roofLength: assessment.engineerAssessment?.roofLength,
        roofWidth: assessment.engineerAssessment?.roofWidth,
        structuralIntegrity: assessment.engineerAssessment?.structuralIntegrity,
        estimatedInstallationTime: assessment.engineerAssessment?.estimatedInstallationTime,
        recommendations: assessment.engineerAssessment?.recommendations
      },
      performanceEstimates: iotAnalysis ? {
        annualProduction: iotAnalysis.annualProduction || (systemSize || 0) * 1200,
        annualSavings: iotAnalysis.estimatedAnnualSavings || (calculatedTotalCost || 0) * 0.15,
        monthlySavings: iotAnalysis.estimatedMonthlySavings || 0,
        paybackPeriod: iotAnalysis.paybackPeriod || Math.ceil((calculatedTotalCost || 0) / ((systemSize || 1) * 1200 * 0.1)),
        co2Offset: iotAnalysis.co2Offset || (systemSize || 0) * 800,
        siteSuitabilityScore: iotAnalysis.siteSuitabilityScore || 85
      } : {
        annualProduction: (systemSize || 0) * 1200,
        annualSavings: (calculatedTotalCost || 0) * 0.15,
        monthlySavings: 0,
        paybackPeriod: Math.ceil((calculatedTotalCost || 0) / ((systemSize || 1) * 1200 * 0.1)),
        co2Offset: (systemSize || 0) * 800,
        siteSuitabilityScore: 85
      },
      dataCollectionStart: assessment.dataCollectionStart,
      dataCollectionEnd: assessment.dataCollectionEnd,
      iotRecommendations: iotAnalysis ? {
        optimalOrientation: iotAnalysis.optimalOrientation,
        optimalTiltAngle: iotAnalysis.optimalTiltAngle,
        peakSunHours: iotAnalysis.peakSunHours,
        averageTemperature: iotAnalysis.averageTemperature,
        temperatureDerating: iotAnalysis.efficiencyLoss
      } : null
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
        totalCost: calculatedTotalCost,
        includeIoTData: !!includeIoTData,
        hasIoTData: !!iotAnalysis,
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
        panelsNeeded: equipmentDetails?.panelQuantity || parseInt(panelsNeeded) || 0,
        panelType: equipmentDetails?.panel?.name || panelType,
        inverterType: equipmentDetails?.inverter?.name || inverterType,
        batteryType: equipmentDetails?.battery?.name || batteryType,
        installationCost: calculatedInstallationTotal,
        equipmentCost: calculatedEquipmentTotal,
        totalCost: calculatedTotalCost,
        paymentTerms,
        warrantyYears: parseInt(warrantyYears) || 10,
        equipmentBreakdown: {
          panels: costBreakdown.equipment.panels,
          inverter: costBreakdown.equipment.inverter,
          battery: costBreakdown.equipment.battery,
          mountingStructure: costBreakdown.equipment.mountingStructure,
          electricalComponents: costBreakdown.equipment.electricalComponents,
          cables: costBreakdown.equipment.cables,
          junctionBoxes: costBreakdown.equipment.junctionBoxes,
          disconnectSwitches: costBreakdown.equipment.disconnectSwitches,
          meters: costBreakdown.equipment.meters,
          additional: costBreakdown.equipment.additional
        }
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
        totalCost: calculatedTotalCost,
        equipmentCost: calculatedEquipmentTotal,
        installationCost: calculatedInstallationTotal,
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
// Helper function to round to 2 decimal places
const roundTo2Decimals = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
};

// @desc    Create a new pre-assessment booking
// @route   POST /api/pre-assessments
// @access  Private (Customer)
exports.createPreAssessment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      clientId,
      addressId,
      propertyType,
      desiredCapacity,
      roofType,
      roofLength,
      roofWidth,
      systemType,
      preferredDate,
      // NEW FIELDS
      monthlyBill,
      rate,
      consumption,
      dayConsumption,
      nightConsumption,
      dayPercentage,
      nightPercentage,
      totalDailyConsumption,
      targetSavings,  // ✅ ADD TARGET SAVINGS
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

    // Prepare the pre-assessment data with new fields (rounded to 2 decimals)
    const preAssessmentData = {
      clientId: client._id,
      addressId,
      propertyType,
      desiredCapacity: desiredCapacity || '',
      systemType: systemType || null,
      roofType: roofType || '',
      roofLength: roofLength ? parseFloat(roofLength) : null,
      roofWidth: roofWidth ? parseFloat(roofWidth) : null,
      preferredDate: new Date(preferredDate),
      paymentStatus: 'pending',
      assessmentStatus: 'pending_review',
      bookingReference,
      // NEW FIELDS - rounded to 2 decimal places
      monthlyBill: roundTo2Decimals(monthlyBill),
      rate: roundTo2Decimals(rate),
      consumption: roundTo2Decimals(consumption),
      dayConsumption: roundTo2Decimals(dayConsumption),
      nightConsumption: roundTo2Decimals(nightConsumption),
      dayPercentage: roundTo2Decimals(dayPercentage),
      nightPercentage: roundTo2Decimals(nightPercentage),
      totalDailyConsumption: roundTo2Decimals(totalDailyConsumption),
      targetSavings: targetSavings ? parseInt(targetSavings) : null,  // ✅ ADD TARGET SAVINGS
    };

    const preAssessment = new PreAssessment(preAssessmentData);
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
        roofLength: preAssessment.roofLength,
        roofWidth: preAssessment.roofWidth,
        // NEW FIELDS in response (already rounded)
        monthlyBill: preAssessment.monthlyBill,
        rate: preAssessment.rate,
        consumption: preAssessment.consumption,
        dayPercentage: preAssessment.dayPercentage,
        nightPercentage: preAssessment.nightPercentage,
        totalDailyConsumption: preAssessment.totalDailyConsumption,
        targetSavings: preAssessment.targetSavings,  // ✅ ADD TARGET SAVINGS
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
exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, notes } = req.body;
    const adminId = req.user.id;

    const preAssessment = await PreAssessment.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId')
      .populate('clientId.userId', 'email');

    if (!preAssessment) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (preAssessment.paymentGateway === 'paymongo' && preAssessment.autoVerified === true) {
      return res.status(400).json({
        message: 'PayMongo payments are auto-verified and cannot be manually verified'
      });
    }

    let receipt = null;

    if (verified) {
      preAssessment.paymentStatus = 'paid';
      preAssessment.assessmentStatus = 'scheduled';
      preAssessment.confirmedAt = new Date();
      preAssessment.adminRemarks = notes || 'Payment verified by admin';
      preAssessment.verifiedBy = adminId;
      preAssessment.verifiedAt = new Date();

      if (preAssessment.paymentMethod === 'gcash') {
        preAssessment.autoVerified = false;
      }

      // ✅ GENERATE RECEIPT
      try {
        const customerName = `${preAssessment.clientId.contactFirstName || ''} ${preAssessment.clientId.contactLastName || ''}`.trim();

        receipt = await receiptService.generateReceipt({
          paymentType: 'pre_assessment',
          amount: preAssessment.assessmentFee,
          paymentMethod: preAssessment.paymentMethod || 'cash',
          referenceNumber: preAssessment.paymentReference,
          invoiceNumber: preAssessment.invoiceNumber,
          customer: {
            id: preAssessment.clientId._id,
            name: customerName,
            contact: preAssessment.clientId.contactNumber,
            email: preAssessment.clientId.userId?.email
          },
          preAssessmentId: preAssessment._id,
          verifiedBy: adminId,
          verifiedAt: new Date(),
          notes: notes
        });

        preAssessment.receiptUrl = receipt.receiptUrl;
        preAssessment.receiptNumber = receipt.receiptNumber;

        console.log(`✅ Receipt generated for pre-assessment ${preAssessment.bookingReference}: ${receipt.receiptNumber}`);
      } catch (receiptError) {
        console.error('Receipt generation error:', receiptError);
        // Don't block verification if receipt fails, just log it
      }

    } else {
      preAssessment.paymentStatus = 'failed';
      preAssessment.assessmentStatus = 'cancelled';
      preAssessment.adminRemarks = notes || 'Payment rejected by admin';
    }

    await preAssessment.save();

    res.json({
      success: true,
      message: verified ? 'Payment verified successfully' : 'Payment rejected',
      receipt: receipt ? {
        url: receipt.receiptUrl,
        number: receipt.receiptNumber
      } : null,
      booking: {
        _id: preAssessment._id,
        bookingReference: preAssessment.bookingReference,
        invoiceNumber: preAssessment.invoiceNumber,
        paymentStatus: preAssessment.paymentStatus,
        assessmentStatus: preAssessment.assessmentStatus,
        receiptUrl: preAssessment.receiptUrl,
        receiptNumber: preAssessment.receiptNumber
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
      .populate({
        path: 'clientId',
        select: 'contactFirstName contactLastName contactNumber userId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
      .populate('addressId')
      .populate('iotDeviceId')
      .sort({ siteVisitDate: -1, bookedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PreAssessment.countDocuments(query);

    // Console log collected emails
    assessments.forEach((assessment, index) => {
      const email = assessment.clientId?.userId?.email;


    });

    res.json({
      success: true,
      assessments,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get engineer assessments error:', error);
    res.status(500).json({
      message: 'Failed to fetch assessments',
      error: error.message
    });
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
      .populate({
        path: 'clientId',
        select: 'contactFirstName contactLastName contactNumber userId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
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
      .populate('quotation.quotationFileId')
      .sort({ bookedAt: -1 });

    // Format the response to include all necessary fields
    const formattedAssessments = assessments.map(assessment => ({
      _id: assessment._id,
      bookingReference: assessment.bookingReference,
      invoiceNumber: assessment.invoiceNumber,
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
      paymentGateway: assessment.paymentGateway,
      autoVerified: assessment.autoVerified,
      paymentProof: assessment.paymentProof,
      paymentReference: assessment.paymentReference,
      quotation: assessment.quotation,
      finalQuotation: assessment.finalQuotation,
      quotationUrl: assessment.quotation?.quotationUrl || assessment.finalQuotation,
      sitePhotos: assessment.sitePhotos || [],
      receiptUrl: assessment.receiptUrl,
      receiptNumber: assessment.receiptNumber,
      // NEW FIELDS
      monthlyBill: assessment.monthlyBill,
      rate: assessment.rate,
      consumption: assessment.consumption,
      dayConsumption: assessment.dayConsumption,
      nightConsumption: assessment.nightConsumption,
      dayPercentage: assessment.dayPercentage,
      nightPercentage: assessment.nightPercentage,
      totalDailyConsumption: assessment.totalDailyConsumption,
      targetSavings: assessment.targetSavings  // ✅ ADD TARGET SAVINGS
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
    const adminId = req.user.id;

    const assessment = await PreAssessment.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId')
      .populate('clientId.userId', 'email');

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    const oldStatus = assessment.paymentStatus;

    assessment.paymentStatus = paymentStatus;
    assessment.assessmentStatus = assessmentStatus;
    if (notes) assessment.adminRemarks = notes;

    let receipt = null;

    // ✅ GENERATE RECEIPT WHEN MARKING AS PAID
    if (paymentStatus === 'paid' && oldStatus !== 'paid') {
      assessment.confirmedAt = new Date();
      assessment.verifiedBy = adminId;
      assessment.verifiedAt = new Date();

      try {
        const customerName = `${assessment.clientId.contactFirstName || ''} ${assessment.clientId.contactLastName || ''}`.trim();

        receipt = await receiptService.generateReceipt({
          paymentType: 'pre_assessment',
          amount: assessment.assessmentFee,
          paymentMethod: assessment.paymentMethod || 'cash',
          referenceNumber: assessment.paymentReference || `CASH-${assessment.bookingReference}`,
          invoiceNumber: assessment.invoiceNumber,
          customer: {
            id: assessment.clientId._id,
            name: customerName,
            contact: assessment.clientId.contactNumber,
            email: assessment.clientId.userId?.email
          },
          preAssessmentId: assessment._id,
          verifiedBy: adminId,
          verifiedAt: new Date(),
          notes: notes || 'Cash payment marked as paid by admin'
        });

        assessment.receiptUrl = receipt.receiptUrl;
        assessment.receiptNumber = receipt.receiptNumber;

        console.log(`✅ Receipt generated for cash payment: ${receipt.receiptNumber}`);
      } catch (receiptError) {
        console.error('Receipt generation error:', receiptError);
        // Don't block status update if receipt fails
      }
    }

    await assessment.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      receipt: receipt ? {
        url: receipt.receiptUrl,
        number: receipt.receiptNumber
      } : null,
      assessment: {
        _id: assessment._id,
        bookingReference: assessment.bookingReference,
        paymentStatus: assessment.paymentStatus,
        receiptUrl: assessment.receiptUrl,
        receiptNumber: assessment.receiptNumber
      }
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

// @desc    Upload site images (Engineer)
// @route   POST /api/pre-assessments/:id/upload-images
// @access  Private (Engineer)
exports.uploadSiteImages = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
    const files = req.files;

    console.log('Uploading site images for assessment:', id);
    console.log('Files received:', files?.length || 0);

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Check if engineer is assigned
    if (assessment.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { processUpload } = require('../middleware/uploadMiddleware');
    const File = require('../models/File');

    const imageUrls = [];
    const fileRecords = [];

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.originalname}`);

        const folder = `site-assessments/${assessment.bookingReference}/site-photos`;
        const publicId = `site_photo_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const processedFile = await processUpload(req, file, folder, publicId);

        if (processedFile && processedFile.url) {
          console.log(`✅ Uploaded: ${processedFile.filename} (${processedFile.storageType})`);
          imageUrls.push(processedFile.url);

          // Create file record
          const fileRecord = new File({
            filename: processedFile.filename,
            originalName: file.originalname,
            fileType: 'site_photo',
            mimeType: file.mimetype,
            size: file.size,
            url: processedFile.url,
            publicId: processedFile.publicId,
            uploadedBy: engineerId,
            userRole: 'engineer',
            relatedTo: 'pre_assessment',
            relatedId: assessment._id,
            metadata: {
              bookingReference: assessment.bookingReference,
              uploadType: 'site_photo',
              storageType: processedFile.storageType,
              uploadedAt: new Date().toISOString()
            }
          });

          await fileRecord.save();
          fileRecords.push(fileRecord);
        } else {
          console.error(`Failed to process file: ${file.originalname} - No URL returned`);
        }
      } catch (uploadError) {
        console.error('Error processing file:', file.originalname, uploadError.message);
      }
    }

    if (imageUrls.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload any images'
      });
    }

    // Initialize sitePhotos array if it doesn't exist
    if (!assessment.sitePhotos) {
      assessment.sitePhotos = [];
    }

    // Add new images to existing ones
    assessment.sitePhotos.push(...imageUrls);

    // Store file references in assessment documents
    if (!assessment.assessmentDocuments) {
      assessment.assessmentDocuments = [];
    }

    fileRecords.forEach(fileRecord => {
      assessment.assessmentDocuments.push({
        fileId: fileRecord._id,
        documentType: 'site_photo',
        description: `Site inspection photo uploaded by engineer`,
        uploadedAt: new Date()
      });
    });

    await assessment.save();

    console.log(`✅ Uploaded ${imageUrls.length} site images for assessment ${assessment.bookingReference}`);
    console.log('Image URLs:', imageUrls);

    res.json({
      success: true,
      message: `${imageUrls.length} image(s) uploaded successfully`,
      images: imageUrls,
      fileRecords: fileRecords.map(f => ({
        id: f._id,
        url: f.url,
        originalName: f.originalName,
        storageType: f.metadata?.storageType
      })),
      totalPhotos: assessment.sitePhotos.length
    });

  } catch (error) {
    console.error('Upload site images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
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
      .populate({
        path: 'clientId',
        select: 'contactFirstName contactLastName contactNumber client_type userId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      })
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

    // Create response with rounded decimal fields
    const assessmentObj = assessment.toObject();

    // Round numeric fields to 2 decimal places
    assessmentObj.monthlyBill = roundTo2Decimals(assessmentObj.monthlyBill);
    assessmentObj.rate = roundTo2Decimals(assessmentObj.rate);
    assessmentObj.consumption = roundTo2Decimals(assessmentObj.consumption);
    assessmentObj.dayConsumption = roundTo2Decimals(assessmentObj.dayConsumption);
    assessmentObj.nightConsumption = roundTo2Decimals(assessmentObj.nightConsumption);
    assessmentObj.dayPercentage = roundTo2Decimals(assessmentObj.dayPercentage);
    assessmentObj.nightPercentage = roundTo2Decimals(assessmentObj.nightPercentage);
    assessmentObj.totalDailyConsumption = roundTo2Decimals(assessmentObj.totalDailyConsumption);
    // targetSavings is integer, no rounding needed
    assessmentObj.targetSavings = assessmentObj.targetSavings;

    res.json({
      success: true,
      assessment: assessmentObj
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
    const { range = '7days', limit = 1000 } = req.query;

    console.log('=== getIoTData Called ===');
    console.log('Assessment ID:', id);

    // Populate the iotDeviceId to get the full device object
    const assessment = await PreAssessment.findById(id).populate('iotDeviceId');

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Check if engineer is assigned to this assessment
    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized to view this data' });
    }

    // Get the actual deviceId from the populated iotDeviceId object
    const deviceId = assessment.iotDeviceId?.deviceId;

    if (!deviceId) {
      return res.status(404).json({ message: 'No device associated with this assessment' });
    }

    console.log('✅ Using deviceId:', deviceId);

    // Build date range query
    let dateQuery = {};
    const now = new Date();

    switch (range) {
      case '24h':
        dateQuery = { timestamp: { $gte: new Date(now.setHours(now.getHours() - 24)) } };
        break;
      case '7days':
        dateQuery = { timestamp: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
        break;
      case '30days':
        dateQuery = { timestamp: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
        break;
      case 'all':
      default:
        dateQuery = {};
        break;
    }

    // Get IoT data from SensorData table
    const sensorData = await SensorData.find({
      deviceId: deviceId,
      ...dateQuery
    })
      .sort({ timestamp: 1 })  // Ascending for calculations
      .limit(parseInt(limit));

    console.log(`📊 Found ${sensorData.length} sensor readings`);

    // ============ CALCULATE STATISTICS ============
    const stats = {
      totalReadings: sensorData.length,
      dataCollectionStart: assessment.dataCollectionStart,
      dataCollectionEnd: assessment.dataCollectionEnd,

      // Irradiance Metrics
      averageIrradiance: 0,
      maxIrradiance: 0,
      minIrradiance: 0,
      peakSunHours: 0,

      // Temperature Metrics
      averageTemperature: 0,
      minTemperature: 0,
      maxTemperature: 0,

      // Humidity Metrics
      averageHumidity: 0,
      minHumidity: 0,
      maxHumidity: 0,

      // GPS
      gps: null
    };

    if (sensorData.length > 0) {
      // ============ IRRADIANCE METRICS ============
      const irradianceValues = sensorData.map(d => d.irradiance || 0);
      const positiveIrradiance = irradianceValues.filter(v => v > 0);

      stats.averageIrradiance = positiveIrradiance.length > 0
        ? Math.round((positiveIrradiance.reduce((a, b) => a + b, 0) / positiveIrradiance.length) * 10) / 10
        : 0;
      stats.maxIrradiance = Math.max(...irradianceValues);
      stats.minIrradiance = positiveIrradiance.length > 0 ? Math.min(...positiveIrradiance) : 0;

      // ============ PEAK SUN HOURS (≥1000 W/m²) - AVERAGE PER DAY ============
      const INTERVAL_HOURS = 0.25; // 15 minutes = 0.25 hours
      let totalPeakSunHoursOverPeriod = 0;
      let intervalsAbove1000 = 0;

      if (sensorData.length >= 2) {
        for (let i = 0; i < sensorData.length - 1; i++) {
          const avgIrradiance = (sensorData[i].irradiance + sensorData[i + 1].irradiance) / 2;

          // Only count when irradiance reaches 1000 W/m² (full sun condition)
          if (avgIrradiance >= 1000) {
            totalPeakSunHoursOverPeriod += INTERVAL_HOURS;
            intervalsAbove1000++;
          }
        }
      }

      // Calculate number of days in the data collection period
      let numberOfDays = 1;
      if (sensorData.length > 0) {
        const firstTimestamp = new Date(sensorData[0].timestamp);
        const lastTimestamp = new Date(sensorData[sensorData.length - 1].timestamp);
        const timeDiffMs = lastTimestamp - firstTimestamp;
        numberOfDays = Math.max(1, Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24)));
      }

      // Average Peak Sun Hours PER DAY
      const averagePeakSunHoursPerDay = totalPeakSunHoursOverPeriod / numberOfDays;
      stats.peakSunHours = Math.round(averagePeakSunHoursPerDay * 10) / 10;

      // ============ TEMPERATURE METRICS ============
      const tempValues = sensorData
        .map(d => d.temperature)
        .filter(t => t !== null && t !== undefined && t !== 0 && t > 0 && t < 60);

      if (tempValues.length > 0) {
        stats.averageTemperature = Math.round((tempValues.reduce((a, b) => a + b, 0) / tempValues.length) * 10) / 10;
        stats.minTemperature = Math.min(...tempValues);
        stats.maxTemperature = Math.max(...tempValues);
      }

      // ============ HUMIDITY METRICS ============
      const humidityValues = sensorData
        .map(d => d.humidity)
        .filter(h => h !== null && h !== undefined && h !== 0 && h > 0 && h <= 100);

      if (humidityValues.length > 0) {
        stats.averageHumidity = Math.round(humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length);
        stats.minHumidity = Math.min(...humidityValues);
        stats.maxHumidity = Math.max(...humidityValues);
      }

      // ============ GPS DATA ============
      const readingWithGps = sensorData.find(r => r.gps && (r.gps.latitude || r.gps.longitude));
      if (readingWithGps && readingWithGps.gps) {
        stats.gps = readingWithGps.gps;
      }

      console.log('Calculated stats:', {
        totalReadings: stats.totalReadings,
        totalPeakSunHoursOverPeriod: totalPeakSunHoursOverPeriod.toFixed(1) + ' hours',
        numberOfDays: numberOfDays,
        peakSunHours: stats.peakSunHours + ' hours/day',
        intervalsAbove1000: intervalsAbove1000,
        avgIrradiance: stats.averageIrradiance,
        avgTemp: stats.averageTemperature,
        avgHumidity: stats.averageHumidity
      });
    }

    // Format readings for frontend (only needed data)
    const formattedReadings = sensorData.map(reading => ({
      timestamp: reading.timestamp,
      irradiance: reading.irradiance || 0,
      temperature: reading.temperature || 0,
      humidity: reading.humidity || 0
    }));

    // Return only what frontend needs
    res.json({
      success: true,
      readings: formattedReadings,
      stats: stats,
      device: {
        deviceId: assessment.iotDeviceId?.deviceId,
        deviceName: assessment.iotDeviceId?.deviceName,
        batteryLevel: assessment.iotDeviceId?.batteryLevel,
        lastHeartbeat: assessment.iotDeviceId?.lastHeartbeat
      }
    });

  } catch (error) {
    console.error('❌ Get IoT data error:', error);
    res.status(500).json({ message: 'Failed to fetch IoT data', error: error.message });
  }
};

// @desc    Retrieve device after data collection and save data to pre-assessment
// @route   PUT /api/pre-assessments/:id/retrieve-device
// @access  Private (Engineer)
exports.retrieveDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;

    console.log('=== RETRIEVE DEVICE STARTED ===');
    console.log('Assessment ID:', id);

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Check if engineer is assigned
    if (assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if device exists
    if (!assessment.iotDeviceId) {
      return res.status(400).json({ message: 'No device associated with this assessment' });
    }

    // Get device details
    const device = await IoTDevice.findById(assessment.iotDeviceId);
    if (!device) {
      return res.status(404).json({ message: 'IoT Device not found' });
    }

    const deviceId = device.deviceId;
    console.log('Device ID:', deviceId);

    // ============ FIX: Get ALL sensor data first (no date filter) ============
    let sensorData = await SensorData.find({
      deviceId: deviceId
    }).sort({ timestamp: 1 });

    console.log(`Total sensor readings found for device ${deviceId}: ${sensorData.length}`);

    // If still no data, try case-insensitive or partial match
    if (sensorData.length === 0) {
      // Try to find any sensor data with similar deviceId
      const allSensorData = await SensorData.find().limit(5);
      console.log('Sample deviceIds in SensorData:', allSensorData.map(s => s.deviceId));

      return res.status(404).json({
        message: 'No sensor data found for this device.',
        deviceId: deviceId,
        hint: 'Check if the device has sent any data yet. The device may still be collecting data.'
      });
    }

    console.log(`✅ Processing ${sensorData.length} sensor readings`);

    // ============ Calculate actual date range from the data ============
    const actualStartDate = sensorData[0].timestamp;
    const actualEndDate = sensorData[sensorData.length - 1].timestamp;

    // Calculate number of days from actual data
    const timeDiffMs = new Date(actualEndDate) - new Date(actualStartDate);
    const numberOfDays = Math.max(1, Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24)));

    console.log(`Data range: ${actualStartDate} to ${actualEndDate} (${numberOfDays} days)`);

    // ============ PROCESS IRRADIANCE METRICS ============
    const irradianceValues = sensorData.map(d => d.irradiance || 0);
    const positiveIrradiance = irradianceValues.filter(v => v > 0);

    const averageIrradiance = positiveIrradiance.length > 0
      ? positiveIrradiance.reduce((a, b) => a + b, 0) / positiveIrradiance.length
      : 0;
    const maxIrradiance = irradianceValues.length > 0 ? Math.max(...irradianceValues) : 0;
    const minIrradiance = positiveIrradiance.length > 0 ? Math.min(...positiveIrradiance) : 0;

    // ============ PEAK SUN HOURS (≥1000 W/m²) - AVERAGE PER DAY ============
    const INTERVAL_HOURS = 0.25; // 15 minutes = 0.25 hours
    let totalPeakSunHoursOverPeriod = 0;
    let intervalsAbove1000 = 0;

    if (sensorData.length >= 2) {
      for (let i = 0; i < sensorData.length - 1; i++) {
        const avgIrradiance = (sensorData[i].irradiance + sensorData[i + 1].irradiance) / 2;

        if (avgIrradiance >= 1000) {
          totalPeakSunHoursOverPeriod += INTERVAL_HOURS;
          intervalsAbove1000++;
        }
      }
    }

    // Average Peak Sun Hours PER DAY
    const averagePeakSunHoursPerDay = totalPeakSunHoursOverPeriod / numberOfDays;
    const peakSunHours = Math.round(averagePeakSunHoursPerDay * 10) / 10;

    // ============ PROCESS TEMPERATURE METRICS ============
    const tempValues = sensorData
      .map(d => d.temperature)
      .filter(t => t !== null && t !== undefined && t !== 0 && t > 0 && t < 60);

    const averageTemperature = tempValues.length > 0
      ? tempValues.reduce((a, b) => a + b, 0) / tempValues.length
      : 0;
    const maxTemperature = tempValues.length > 0 ? Math.max(...tempValues) : 0;
    const minTemperature = tempValues.length > 0 ? Math.min(...tempValues) : 0;

    // ============ PROCESS HUMIDITY METRICS ============
    const humidityValues = sensorData
      .map(d => d.humidity)
      .filter(h => h !== null && h !== undefined && h !== 0 && h > 0 && h <= 100);

    const averageHumidity = humidityValues.length > 0
      ? humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length
      : 0;
    const maxHumidity = humidityValues.length > 0 ? Math.max(...humidityValues) : 0;
    const minHumidity = humidityValues.length > 0 ? Math.min(...humidityValues) : 0;

    // ============ PROCESS GPS DATA ============
    const readingWithGps = sensorData.find(r => r.gps && (r.gps.latitude || r.gps.longitude));
    const gpsCoordinates = readingWithGps?.gps || null;

    console.log('Processed data:', {
      totalReadings: sensorData.length,
      totalPeakSunHoursOverPeriod: totalPeakSunHoursOverPeriod.toFixed(1) + ' hours',
      numberOfDays: numberOfDays,
      peakSunHours: peakSunHours + ' hours/day',
      intervalsAbove1000: intervalsAbove1000,
      averageIrradiance: averageIrradiance.toFixed(1) + ' W/m²',
      maxIrradiance: maxIrradiance + ' W/m²',
      averageTemperature: averageTemperature.toFixed(1) + '°C',
      temperatureRange: `${minTemperature.toFixed(1)}°C - ${maxTemperature.toFixed(1)}°C`,
      averageHumidity: averageHumidity.toFixed(0) + '%',
    });

    // Save data to assessment
    assessment.assessmentResults = {
      dataCollectionStart: assessment.dataCollectionStart || actualStartDate,
      dataCollectionEnd: new Date(),
      totalReadings: sensorData.length,

      // Irradiance Metrics
      averageIrradiance: Math.round(averageIrradiance * 10) / 10,
      maxIrradiance: maxIrradiance,
      minIrradiance: minIrradiance,
      peakSunHours: peakSunHours,
      intervalsAbove1000: intervalsAbove1000,

      // Temperature Metrics
      averageTemperature: Math.round(averageTemperature * 10) / 10,
      maxTemperature: maxTemperature,
      minTemperature: minTemperature,

      // Humidity Metrics
      averageHumidity: Math.round(averageHumidity),
      maxHumidity: maxHumidity,
      minHumidity: minHumidity,

      // GPS Location
      gpsCoordinates: {
        latitude: gpsCoordinates?.latitude || null,
        longitude: gpsCoordinates?.longitude || null
      }
    };

    // Update assessment main fields
    assessment.assessmentStatus = 'data_analyzing';
    assessment.dataCollectionEnd = new Date();
    assessment.totalReadings = sensorData.length;
    assessment.deviceRetrievedAt = new Date();
    assessment.deviceRetrievedBy = engineerId;

    if (!assessment.dataCollectionStart && sensorData.length > 0) {
      assessment.dataCollectionStart = actualStartDate;
    }

    // Update device status
    if (device) {
      device.status = 'retrieved';
      device.retrievedAt = new Date();
      device.retrievedBy = engineerId;
      device.retrievalNotes = `Device retrieved. Readings: ${sensorData.length}, PSH: ${peakSunHours} hours/day, ${intervalsAbove1000} intervals ≥1000 W/m²`;

      if (!device.deploymentHistory) device.deploymentHistory = [];
      device.deploymentHistory.push({
        preAssessmentId: assessment._id,
        retrievedAt: new Date(),
        retrievedBy: engineerId,
        notes: `Total readings: ${sensorData.length}. Peak Sun Hours: ${peakSunHours} hours/day (${intervalsAbove1000} intervals)`
      });

      await device.save();
    }

    await assessment.save();

    res.json({
      success: true,
      message: `Device retrieved successfully. Processed ${sensorData.length} readings over ${numberOfDays} days. Average Peak Sun Hours: ${peakSunHours} hours/day (${intervalsAbove1000} intervals ≥1000 W/m²)`,
      assessment: {
        id: assessment._id,
        status: assessment.assessmentStatus,
        assessmentResults: assessment.assessmentResults
      }
    });

  } catch (error) {
    console.error('Retrieve device error:', error);
    res.status(500).json({ message: 'Failed to retrieve device', error: error.message });
  }
};
// @desc    Get system recommendations based on IoT data and customer inputs
// @route   GET /api/pre-assessments/:id/system-recommendations
// @access  Private (Engineer, Admin)
exports.getSystemRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch the assessment with all needed data
    const assessment = await PreAssessment.findById(id)
      .populate('clientId', 'contactFirstName contactLastName')
      .populate('addressId');

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Check authorization
    const client = await Client.findOne({ userId });
    if (userRole !== 'admin' && userRole !== 'engineer' && assessment.clientId._id.toString() !== client?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ============ COLLECT EXISTING DATA FROM SCHEMA ============

    // Get IoT data from assessmentResults
    const iotData = assessment.assessmentResults || {};

    // Get customer electric bill data
    const monthlyBill = assessment.monthlyBill || 0;
    const rate = assessment.rate || 12;
    const consumption = assessment.consumption || 0;
    const totalDailyConsumption = assessment.totalDailyConsumption || 0;
    const targetSavings = assessment.targetSavings || 100;
    const dayPercentage = assessment.dayPercentage || 60;
    const nightPercentage = assessment.nightPercentage || 40;

    // Get system type from assessment
    const systemType = assessment.systemType || 'grid-tie';

    // Battery type (default to LiFePO4)
    const batteryType = 'lifepo4'; // Could be stored in assessment or passed from frontend
    const DEPTH_OF_DISCHARGE = batteryType === 'lifepo4' ? 0.8 : 0.5; // 80% for LiFePO4, 50% for Gel/AGM

    // Get roof dimensions
    const roofLength = assessment.engineerAssessment?.roofLength || assessment.roofLength || 10;
    const roofWidth = assessment.engineerAssessment?.roofWidth || assessment.roofWidth || 8;

    // Get IoT metrics
    const peakSunHours = iotData.peakSunHours || 4.5;
    const shadingPercentage = iotData.shadingPercentage || 0;
    const averageIrradiance = iotData.averageIrradiance || 0;
    const averageTemperature = iotData.averageTemperature || 0;
    const averageHumidity = iotData.averageHumidity || 0;
    const minTemperature = iotData.minTemperature || 0;
    const maxTemperature = iotData.maxTemperature || 0;
    const minHumidity = iotData.minHumidity || 0;
    const maxHumidity = iotData.maxHumidity || 0;
    const gpsCoordinates = iotData.gpsCoordinates || null;
    const totalReadings = iotData.totalReadings || 0;

    // Calculate daily energy need (use totalDailyConsumption if available, otherwise calculate)
    let dailyEnergyNeed = totalDailyConsumption;
    if (dailyEnergyNeed === 0 && monthlyBill > 0 && rate > 0) {
      const monthlyKwh = monthlyBill / rate;
      dailyEnergyNeed = monthlyKwh / 30;
    }

    // Apply target savings for PV system size
    const adjustedDailyEnergyNeed = dailyEnergyNeed * (targetSavings / 100);

    // Use ACTUAL daily consumption for battery sizing (not adjusted by target savings)
    const actualDailyConsumption = dailyEnergyNeed;

    // ============ SYSTEM SIZE CALCULATIONS ============
    let recommendedSystemSize = 0;
    let batteryCapacityKwh = 0;
    let inverterSize = 0;

    if (systemType === 'grid-tie') {
      // Grid-Tie: total daily consumption (kW)
      recommendedSystemSize = adjustedDailyEnergyNeed;
      inverterSize = Math.ceil(recommendedSystemSize); // Same as system size
      batteryCapacityKwh = 0;

    } else if (systemType === 'hybrid') {
      // Hybrid: (total daily consumption × 1.3 safety factor) / peak sun hours
      recommendedSystemSize = (adjustedDailyEnergyNeed * 1.3) / peakSunHours;
      recommendedSystemSize = Math.round(recommendedSystemSize * 10) / 10;

      // Inverter: same as system size (1:1 ratio)
      inverterSize = Math.ceil(recommendedSystemSize);

      // Battery: ACTUAL daily consumption / depth of discharge
      batteryCapacityKwh = actualDailyConsumption / DEPTH_OF_DISCHARGE;
      batteryCapacityKwh = Math.round(batteryCapacityKwh * 10) / 10;

    } else if (systemType === 'off-grid') {
      // Off-Grid: (total daily consumption × 1.3 safety factor) / peak sun hours
      recommendedSystemSize = (adjustedDailyEnergyNeed * 1.3) / peakSunHours;
      recommendedSystemSize = Math.round(recommendedSystemSize * 10) / 10;

      // Inverter: same as system size (1:1 ratio)
      inverterSize = Math.ceil(recommendedSystemSize);

      // Battery: ACTUAL daily consumption / depth of discharge
      batteryCapacityKwh = actualDailyConsumption / DEPTH_OF_DISCHARGE;
      batteryCapacityKwh = Math.round(batteryCapacityKwh * 10) / 10;

    } else {
      // Default
      recommendedSystemSize = adjustedDailyEnergyNeed;
      inverterSize = Math.ceil(recommendedSystemSize);
      batteryCapacityKwh = 0;
    }

    // Calculate panels needed (550W panels = 0.55 kW)
    const panelWattage = 0.55;
    const panelsNeeded = Math.ceil(recommendedSystemSize / panelWattage);

    // Calculate temperature derating
    const tempDerating = Math.max(0, (averageTemperature - 25) * -0.004) * 100;

    // Calculate performance ratio
    const performanceRatio = 0.85 - (shadingPercentage / 100) - (Math.abs(tempDerating) / 100);

    // Determine optimal orientation
    let optimalOrientation = 'South';
    if (peakSunHours > 5.5) optimalOrientation = 'South';
    else if (peakSunHours > 4.5) optimalOrientation = 'South-East';
    else if (peakSunHours > 3.5) optimalOrientation = 'East-West';
    else optimalOrientation = 'East';

    // Calculate optimal tilt angle
    const optimalTilt = Math.min(30, Math.max(10, Math.floor(peakSunHours * 2.5)));

    // Calculate available roof area
    const availableRoofArea = roofLength * roofWidth;

    // Calculate installation time
    const estimatedInstallationTime = Math.ceil(panelsNeeded / 4) + 1;

    // Calculate costs
    const equipmentCost = panelsNeeded * 15000 + inverterSize * 8000;
    const batteryCost = batteryCapacityKwh * 12000;
    const installationCost = panelsNeeded * 2000;
    const totalCost = equipmentCost + batteryCost + installationCost;

    // Calculate financial metrics
    const electricityRate = rate;
    const annualProduction = recommendedSystemSize * peakSunHours * 365 * 0.8;
    const estimatedAnnualProduction = Math.round(annualProduction);
    const estimatedMonthlySavings = Math.round((annualProduction * electricityRate) / 12);
    const estimatedAnnualSavings = Math.round(estimatedMonthlySavings * 12);

    // Calculate payback period
    let paybackPeriod = 0;
    if (estimatedAnnualSavings > 0) {
      paybackPeriod = Math.round((totalCost / estimatedAnnualSavings) * 10) / 10;
    }

    // Calculate CO2 offset
    const co2Offset = Math.round(annualProduction * 0.5);

    // Calculate site suitability score
    let siteSuitabilityScore = 100;
    if (peakSunHours < 4) siteSuitabilityScore -= 35;
    else if (peakSunHours < 4.5) siteSuitabilityScore -= 20;
    else if (peakSunHours < 5) siteSuitabilityScore -= 10;

    if (shadingPercentage > 20) siteSuitabilityScore -= 25;
    else if (shadingPercentage > 10) siteSuitabilityScore -= 15;
    else if (shadingPercentage > 5) siteSuitabilityScore -= 5;

    if (tempDerating > 15) siteSuitabilityScore -= 15;
    else if (tempDerating > 10) siteSuitabilityScore -= 8;
    else if (tempDerating > 5) siteSuitabilityScore -= 3;

    siteSuitabilityScore = Math.max(0, Math.min(100, siteSuitabilityScore));

    // Temperature and humidity ranges
    const temperatureRange = `${minTemperature.toFixed(1)}°C - ${maxTemperature.toFixed(1)}°C`;
    const humidityRange = `${minHumidity.toFixed(0)}% - ${maxHumidity.toFixed(0)}%`;

    // Day and night consumption
    const dayConsumption = adjustedDailyEnergyNeed * (dayPercentage / 100);
    const nightConsumption = adjustedDailyEnergyNeed * (nightPercentage / 100);

    // ============ PREPARE RESPONSE ============
    const systemMetrics = {
      // System Type
      systemType: systemType,
      batteryType: batteryType,
      depthOfDischarge: DEPTH_OF_DISCHARGE * 100,

      // IoT Data
      peakSunHours: roundTo2Decimals(peakSunHours),
      shadingPercentage: roundTo2Decimals(shadingPercentage),
      temperatureDerating: roundTo2Decimals(tempDerating),
      averageIrradiance: roundTo2Decimals(averageIrradiance),
      averageTemperature: roundTo2Decimals(averageTemperature),
      averageHumidity: roundTo2Decimals(averageHumidity),
      temperatureRange: temperatureRange,
      humidityRange: humidityRange,
      gpsLocation: gpsCoordinates,
      totalReadings: totalReadings,

      // Customer Bill Data
      monthlyBill: roundTo2Decimals(monthlyBill),
      electricityRate: rate,
      monthlyConsumption: roundTo2Decimals(consumption),
      dailyEnergyNeed: roundTo2Decimals(dailyEnergyNeed),
      targetSavings: targetSavings,
      adjustedDailyEnergyNeed: roundTo2Decimals(adjustedDailyEnergyNeed),
      dayPercentage: roundTo2Decimals(dayPercentage),
      nightPercentage: roundTo2Decimals(nightPercentage),

      // Consumption Breakdown
      dayConsumption: roundTo2Decimals(dayConsumption),
      nightConsumption: roundTo2Decimals(nightConsumption),

      // System Design
      recommendedSystemSize: roundTo2Decimals(recommendedSystemSize),
      inverterSize: inverterSize,
      batteryCapacityKwh: roundTo2Decimals(batteryCapacityKwh),
      panelsNeeded: panelsNeeded,
      panelWattage: panelWattage,
      performanceRatio: roundTo2Decimals(performanceRatio),

      // Installation
      optimalOrientation: optimalOrientation,
      optimalTilt: optimalTilt,
      roofLength: roofLength,
      roofWidth: roofWidth,
      availableRoofArea: roundTo2Decimals(availableRoofArea),
      estimatedInstallationTime: estimatedInstallationTime,

      // Financial
      estimatedEquipmentCost: roundTo2Decimals(equipmentCost),
      estimatedBatteryCost: roundTo2Decimals(batteryCost),
      estimatedInstallationCost: roundTo2Decimals(installationCost),
      estimatedTotalCost: roundTo2Decimals(totalCost),
      estimatedAnnualProduction: estimatedAnnualProduction,
      estimatedMonthlySavings: estimatedMonthlySavings,
      estimatedAnnualSavings: estimatedAnnualSavings,
      paybackPeriod: roundTo2Decimals(paybackPeriod),
      co2Offset: co2Offset,

      // Suitability
      siteSuitabilityScore: siteSuitabilityScore,

      // Data Collection Info
      dataCollectionStart: assessment.dataCollectionStart,
      dataCollectionEnd: assessment.dataCollectionEnd,

      // Formula reference
      formula: {
        systemType: systemType,
        pvFormula: systemType === 'grid-tie'
          ? `System Size = ${roundTo2Decimals(adjustedDailyEnergyNeed)} kW`
          : `System Size = (${roundTo2Decimals(adjustedDailyEnergyNeed)} * 1.3) ÷ ${roundTo2Decimals(peakSunHours)} = ${roundTo2Decimals(recommendedSystemSize)} kW`,
        inverterFormula: `Inverter = ${roundTo2Decimals(recommendedSystemSize)} kW`,
        batteryFormula: batteryCapacityKwh > 0
          ? `Battery = ${roundTo2Decimals(actualDailyConsumption)} ÷ ${DEPTH_OF_DISCHARGE} = ${roundTo2Decimals(batteryCapacityKwh)} kWh`
          : 'No battery required for grid-tie system'
      }
    };

    res.json({
      success: true,
      systemMetrics: systemMetrics,
      assessment: {
        id: assessment._id,
        bookingReference: assessment.bookingReference,
        propertyType: assessment.propertyType
      }
    });

  } catch (error) {
    console.error('Get system recommendations error:', error);
    res.status(500).json({ message: 'Failed to get system recommendations', error: error.message });
  }
};
// ============ HELPER FUNCTIONS ============

/**
 * Get Irradiance metrics (min, max, average)
 * Filters out zero values for min calculation
 */
function getIrradianceRange(sensorData) {
  const irradianceValues = sensorData.map(d => d.irradiance || 0);
  const positiveIrradiance = irradianceValues.filter(i => i > 0);

  const average = irradianceValues.length > 0
    ? irradianceValues.reduce((a, b) => a + b, 0) / irradianceValues.length
    : 0;

  const max = irradianceValues.length > 0
    ? Math.max(...irradianceValues)
    : 0;

  // Only use positive values for min to avoid 0
  const min = positiveIrradiance.length > 0
    ? Math.min(...positiveIrradiance)
    : 0;

  return {
    average: Math.round(average * 10) / 10,
    max,
    min,
    values: irradianceValues
  };
}

/**
 * Get Temperature metrics (min, max, average)
 * Filters out invalid values (0, null, undefined)
 */
function getTemperatureRange(sensorData) {
  const tempValues = sensorData
    .map(d => d.temperature)
    .filter(t => t !== null && t !== undefined && t !== 0 && t > 0 && t < 60);

  if (tempValues.length === 0) {
    console.log('⚠️ No valid temperature readings found, using defaults');
    return {
      min: 25,
      max: 32,
      average: 28,
      values: []
    };
  }

  const min = Math.min(...tempValues);
  const max = Math.max(...tempValues);
  const average = tempValues.reduce((a, b) => a + b, 0) / tempValues.length;

  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    average: Math.round(average * 10) / 10,
    values: tempValues
  };
}

/**
 * Get Humidity metrics (min, max, average)
 * Filters out invalid values (0, null, undefined, >100)
 */
function getHumidityRange(sensorData) {
  const humidityValues = sensorData
    .map(d => d.humidity)
    .filter(h => h !== null && h !== undefined && h !== 0 && h > 0 && h <= 100);

  if (humidityValues.length === 0) {
    console.log('⚠️ No valid humidity readings found, using defaults');
    return {
      min: 65,
      max: 85,
      average: 75,
      values: []
    };
  }

  const min = Math.min(...humidityValues);
  const max = Math.max(...humidityValues);
  const average = humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length;

  return {
    min: Math.round(min),
    max: Math.round(max),
    average: Math.round(average),
    values: humidityValues
  };
}

/**
 * Calculate Peak Sun Hours (PSH)
 * Hours where solar irradiance reaches 1000 W/m²
 */
function calculatePeakSunHours(sensorData) {
  if (!sensorData || sensorData.length < 2) return 4.5;

  let totalPSH = 0;
  let totalHours = 0;

  for (let i = 0; i < sensorData.length - 1; i++) {
    const timeDiff = (new Date(sensorData[i + 1].timestamp) - new Date(sensorData[i].timestamp)) / (1000 * 60 * 60);
    const avgIrradiance = (sensorData[i].irradiance + sensorData[i + 1].irradiance) / 2;

    // Only count if there's meaningful irradiance (daylight hours)
    if (avgIrradiance > 10) {
      // Convert W/m² to kW/m² (divide by 1000) and multiply by hours
      const pshContribution = (avgIrradiance / 1000) * timeDiff;
      totalPSH += pshContribution;
      totalHours += timeDiff;
    }
  }

  let result = Math.round(totalPSH * 10) / 10;

  // Sanity check - PSH should be between 3-7 hours for Philippines
  if (result > 8) result = 5.5;
  if (result < 2) result = 4.0;

  return result;
}

/**
 * Get Daily Energy Consumption (kWh/day)
 */
function getDailyEnergyConsumption(assessment) {
  if (assessment.dailyEnergyConsumption) {
    return assessment.dailyEnergyConsumption;
  }
  return 20; // Default for residential Philippines
}

/**
 * Calculate Recommended System Size (kW)
 */
function calculateRecommendedSystemSize(dailyConsumption, peakSunHours, efficiency = 0.8) {
  if (!peakSunHours || peakSunHours <= 0) return 5.0;

  const systemSize = dailyConsumption / (peakSunHours * efficiency);
  const result = Math.max(1, Math.round(systemSize * 10) / 10);
  return result;
}

/**
 * Calculate Number of Panels Needed
 */
function calculatePanelsNeeded(systemSizeKw, panelRatingW = 400) {
  const panels = (systemSizeKw * 1000) / panelRatingW;
  return Math.max(1, Math.ceil(panels));
}

/**
 * Calculate Optimal Panel Angle based on month and latitude
 */
function calculateOptimalPanelAngle(latitude) {
  const currentMonth = new Date().getMonth() + 1;
  let angle;

  switch (currentMonth) {
    case 1: angle = (latitude + 23.4) * 0.734899; break;
    case 2: angle = (latitude + 15.6) * 0.835051; break;
    case 3: angle = (latitude + 7.8) * 0.952525; break;
    case 4: angle = latitude * 1.024192; break;
    case 5: angle = (latitude - 7.8) * 0.932828; break;
    case 6: angle = (latitude - 15.6) * 0.827929; break;
    case 7: angle = (latitude - 23.4) * 0.775404; break;
    case 8: angle = (latitude - 15.6) * 0.742929; break;
    case 9: angle = (latitude - 7.8) * 0.776667; break;
    case 10: angle = latitude * 0.749899; break;
    case 11: angle = (latitude + 7.8) * 0.713889; break;
    case 12: angle = (latitude + 15.6) * 0.679192; break;
    default: angle = latitude;
  }

  const direction = angle >= 0 ? "South-facing" : "North-facing";
  const absoluteAngle = Math.abs(Math.round(angle));

  return {
    angle: absoluteAngle,
    direction: direction,
    formulaUsed: `Month ${currentMonth}`,
    explanation: `Optimal tilt angle is ${absoluteAngle}° ${direction} from horizontal`
  };
}

/**
 * Calculate Shading Percentage
 */
function calculateShadingPercentage(irradianceValues) {
  const daylightReadings = irradianceValues.filter(i => i > 10);
  const shadedReadings = irradianceValues.filter(i => i > 10 && i < 100);

  if (daylightReadings.length === 0) return 0;

  const percentage = (shadedReadings.length / daylightReadings.length) * 100;
  return Math.round(percentage);
}

/**
 * Calculate Temperature Derating
 */
function calculateTemperatureDerating(avgTemperature) {
  const STC_TEMP = 25;
  const TEMP_COEFFICIENT = -0.004;

  if (avgTemperature <= STC_TEMP) return 0;

  const tempDiff = avgTemperature - STC_TEMP;
  const derating = Math.abs(tempDiff * TEMP_COEFFICIENT * 100);

  return Math.round(derating * 10) / 10;
}

/**
 * Calculate Annual Production (kWh/year)
 */
function calculateAnnualProduction(systemSizeKw, peakSunHours) {
  const PERFORMANCE_RATIO = 0.8;
  const annualProduction = systemSizeKw * peakSunHours * 365 * PERFORMANCE_RATIO;
  return Math.round(annualProduction);
}

/**
 * Calculate Annual Savings (PHP/year)
 */
function calculateAnnualSavings(annualProductionKwh) {
  const ELECTRICITY_RATE = 12;
  return Math.round(annualProductionKwh * ELECTRICITY_RATE);
}

/**
 * Calculate Total System Cost (PHP)
 */
function calculateSystemCost(systemSizeKw) {
  const COST_PER_KW = 65000;
  return Math.round(systemSizeKw * COST_PER_KW);
}

/**
 * Calculate Payback Period (years)
 */
function calculatePaybackPeriod(systemCost, annualSavings) {
  if (annualSavings <= 0) return 0;
  const period = systemCost / annualSavings;
  return Math.round(period * 100) / 100;
}

/**
 * Calculate CO2 Offset (kg/year)
 */
function calculateCO2Offset(annualProductionKwh) {
  const CO2_PER_KWH = 0.5;
  return Math.round(annualProductionKwh * CO2_PER_KWH);
}

/**
 * Calculate Site Suitability Score (0-100)
 */
function calculateSiteSuitabilityScore(peakSunHours, shadingPercentage, temperatureDerating) {
  let score = 100;

  if (peakSunHours >= 5.5) score -= 0;
  else if (peakSunHours >= 5.0) score -= 10;
  else if (peakSunHours >= 4.5) score -= 20;
  else if (peakSunHours >= 4.0) score -= 35;
  else score -= 50;

  if (shadingPercentage > 30) score -= 25;
  else if (shadingPercentage > 20) score -= 15;
  else if (shadingPercentage > 10) score -= 8;
  else if (shadingPercentage > 5) score -= 3;

  if (temperatureDerating > 15) score -= 15;
  else if (temperatureDerating > 10) score -= 8;
  else if (temperatureDerating > 5) score -= 3;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate Recommendations
 */
function generateRecommendations(peakSunHours, shadingPercentage, temperatureDerating, optimalAngle) {
  const recommendations = [];

  if (peakSunHours >= 5.5) {
    recommendations.push(`Excellent solar resource with ${peakSunHours} peak sun hours - ideal for solar installation`);
  } else if (peakSunHours >= 4.5) {
    recommendations.push(`Good solar resource with ${peakSunHours} peak sun hours - system will perform well`);
  } else {
    recommendations.push(`Moderate solar resource (${peakSunHours} PSH) - consider higher efficiency panels`);
  }

  recommendations.push(`Set panels at ${optimalAngle.angle}° ${optimalAngle.direction} for optimal year-round production`);

  if (shadingPercentage > 15) {
    recommendations.push(`Significant shading detected (${shadingPercentage}%) - trim trees or use micro-inverters`);
  } else if (shadingPercentage > 5) {
    recommendations.push(`Minor shading detected (${shadingPercentage}%) - monitor impact on production`);
  }

  if (temperatureDerating > 10) {
    recommendations.push(`High temperature derating (${temperatureDerating}%) - ensure proper panel ventilation`);
  }

  return recommendations;
}

/**
 * Get sensor data with progressive buffer
 */
async function getSensorDataWithBuffer(deviceId, startDate) {
  // Try 2-hour buffer
  let queryStartDate = new Date(startDate);
  queryStartDate.setHours(queryStartDate.getHours() - 2);

  let sensorData = await SensorData.find({
    deviceId: deviceId,
    timestamp: { $gte: queryStartDate }
  }).sort({ timestamp: 1 });

  if (sensorData.length > 0) {
    console.log(`Found ${sensorData.length} readings with 2-hour buffer`);
    return sensorData;
  }

  // Try 24-hour buffer
  queryStartDate = new Date(startDate);
  queryStartDate.setHours(queryStartDate.getHours() - 24);
  sensorData = await SensorData.find({
    deviceId: deviceId,
    timestamp: { $gte: queryStartDate }
  }).sort({ timestamp: 1 });

  if (sensorData.length > 0) {
    console.log(`Found ${sensorData.length} readings with 24-hour buffer`);
    return sensorData;
  }

  // Try 7-day buffer
  queryStartDate = new Date(startDate);
  queryStartDate.setDate(queryStartDate.getDate() - 7);
  sensorData = await SensorData.find({
    deviceId: deviceId,
    timestamp: { $gte: queryStartDate }
  }).sort({ timestamp: 1 });

  if (sensorData.length > 0) {
    console.log(`Found ${sensorData.length} readings with 7-day buffer`);
    return sensorData;
  }

  // Try 14-day buffer
  queryStartDate = new Date(startDate);
  queryStartDate.setDate(queryStartDate.getDate() - 14);
  sensorData = await SensorData.find({
    deviceId: deviceId,
    timestamp: { $gte: queryStartDate }
  }).sort({ timestamp: 1 });

  console.log(`Found ${sensorData.length} readings with 14-day buffer`);
  return sensorData;
}