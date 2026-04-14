// controllers/reportController.js (Updated - Removed Status # and Status columns)

const PreAssessment = require('../models/PreAssessment');
const Project = require('../models/Project');
const Client = require('../models/Clients');
const SolarInvoice = require('../models/SolarInvoice');

// Company Information
const COMPANY_INFO = {
  name: 'Salfer Engineering',
  address: 'San Nicolas St. Bunsuran 3rd, Pandi, Bulacan',
  tagline: 'Solar Technology Enterprise'
};

// Check if optional packages are installed
let PDFDocument, ExcelJS;
try {
  PDFDocument = require('pdfkit');
} catch (err) {
  console.warn('⚠️ pdfkit not installed. PDF export will be disabled.');
}

try {
  ExcelJS = require('exceljs');
} catch (err) {
  console.warn('⚠️ exceljs not installed. Excel export will be disabled.');
}

// Helper function to add company header to PDF
const addCompanyHeaderToPDF = (doc) => {
  // Company Name
  doc.fontSize(16).font('Helvetica-Bold').text(COMPANY_INFO.name, { align: 'center' });
  doc.moveDown(0.3);

  // Company Address
  doc.fontSize(9).font('Helvetica').text(COMPANY_INFO.address, { align: 'center' });
  doc.moveDown(0.3);

  // Tagline
  doc.fontSize(8).font('Helvetica-Oblique').text(COMPANY_INFO.tagline, { align: 'center' });
  doc.moveDown(0.5);

  // Separator line
  doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
};

// Helper function to add company header to worksheet (Excel)
const addCompanyHeaderToWorksheet = (worksheet, title) => {
  // Merge cells for company header
  worksheet.mergeCells('A1:AF1');
  worksheet.getCell('A1').value = COMPANY_INFO.name;
  worksheet.getCell('A1').font = { size: 14, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:AF2');
  worksheet.getCell('A2').value = COMPANY_INFO.address;
  worksheet.getCell('A2').font = { size: 10 };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:AF3');
  worksheet.getCell('A3').value = COMPANY_INFO.tagline;
  worksheet.getCell('A3').font = { size: 9, italic: true };
  worksheet.getCell('A3').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A4:AF4');
  worksheet.getCell('A4').value = `Report Generated: ${new Date().toLocaleString()}`;
  worksheet.getCell('A4').font = { size: 9 };
  worksheet.getCell('A4').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A5:AF5');
  worksheet.getCell('A5').value = title;
  worksheet.getCell('A5').font = { size: 12, bold: true };
  worksheet.getCell('A5').alignment = { horizontal: 'center' };

  return 6; // Starting row after header
};

// Helper function to convert assessment status string to number
const getStatusNumber = (statusString) => {
  const statusMap = {
    'pending_review': 1,
    'pending_payment': 2,
    'scheduled': 3,
    'site_visit_ongoing': 4,
    'device_deployed': 5,
    'data_collecting': 6,
    'data_analyzing': 7,
    'report_draft': 8,
    'quotation_generated': 9,
    'quotation_accepted': 10,
    'completed': 11,
    'cancelled': 12
  };
  return statusMap[statusString] || null;
};

// Assessment Status display mapping
const ASSESSMENT_STATUS_DISPLAY = {
  1: 'Pending Review',
  2: 'Pending Payment',
  3: 'Scheduled',
  4: 'Site Visit Ongoing',
  5: 'Device Deployed',
  6: 'Data Collecting',
  7: 'Data Analyzing',
  8: 'Report Draft',
  9: 'Quotation Generated',
  10: 'Quotation Accepted',
  11: 'Completed',
  12: 'Cancelled'
};

// Assessment Results Summary Ranges
const ASSESSMENT_RESULTS_SUMMARY = {
  IRRADIANCE: {
    POOR: { min: 0, max: 300, label: 'Poor' },
    MODERATE: { min: 301, max: 500, label: 'Moderate' },
    GOOD: { min: 501, max: 700, label: 'Good' },
    EXCELLENT: { min: 701, max: 1000, label: 'Excellent' }
  },
  TEMPERATURE: {
    OPTIMAL: { min: 15, max: 25, label: 'Optimal' },
    ACCEPTABLE: { min: 26, max: 35, label: 'Acceptable' },
    HIGH: { min: 36, max: 45, label: 'High - Efficiency Reduced' },
    CRITICAL: { min: 46, max: 60, label: 'Critical - Significant Loss' }
  },
  HUMIDITY: {
    LOW: { min: 0, max: 30, label: 'Low' },
    MODERATE: { min: 31, max: 60, label: 'Moderate' },
    HIGH: { min: 61, max: 80, label: 'High' },
    VERY_HIGH: { min: 81, max: 100, label: 'Very High - Condensation Risk' }
  },
  SHADING_IMPACT: {
    NEGLIGIBLE: { min: 0, max: 10, label: 'Negligible Impact' },
    LOW: { min: 11, max: 20, label: 'Low Impact' },
    MODERATE: { min: 21, max: 35, label: 'Moderate Impact' },
    SEVERE: { min: 36, max: 100, label: 'Severe Impact - Not Recommended' }
  },
  SITE_SUITABILITY: {
    POOR: { min: 0, max: 39, label: 'Poor - Not Recommended' },
    FAIR: { min: 40, max: 59, label: 'Fair - Consider with Caution' },
    GOOD: { min: 60, max: 79, label: 'Good - Recommended' },
    EXCELLENT: { min: 80, max: 100, label: 'Excellent - Highly Recommended' }
  }
};

// Helper function to get rating based on value
const getRating = (value, ranges) => {
  if (!value && value !== 0) return null;
  for (const [key, range] of Object.entries(ranges)) {
    if (value >= range.min && value <= range.max) {
      return { key, ...range };
    }
  }
  return null;
};

// Calculate suitability score based on peak sun hours and shading
const calculateSuitabilityScore = (peakSunHours, shadingPercentage, temperatureDerating) => {
  if (peakSunHours === null || peakSunHours === undefined || shadingPercentage === null || shadingPercentage === undefined) {
    return null;
  }

  let score = 100;

  // Peak Sun Hours scoring (max 40 points)
  if (peakSunHours >= 5.5) score -= 0;
  else if (peakSunHours >= 5) score -= 5;
  else if (peakSunHours >= 4.5) score -= 10;
  else if (peakSunHours >= 4) score -= 20;
  else if (peakSunHours >= 3.5) score -= 30;
  else if (peakSunHours >= 3) score -= 40;
  else score -= 50;

  // Shading Percentage scoring (max 30 points)
  if (shadingPercentage <= 5) score -= 0;
  else if (shadingPercentage <= 10) score -= 10;
  else if (shadingPercentage <= 15) score -= 20;
  else if (shadingPercentage <= 20) score -= 25;
  else score -= 30;

  // Temperature Derating scoring (max 30 points)
  const deratingAbs = Math.abs(temperatureDerating || 0);
  if (deratingAbs <= 3) score -= 0;
  else if (deratingAbs <= 5) score -= 10;
  else if (deratingAbs <= 8) score -= 20;
  else score -= 30;

  return Math.max(0, Math.min(100, Math.round(score)));
};

// Get recommendation based on score
const getRecommendation = (score) => {
  if (score === null) return 'Pending Assessment';
  if (score >= 70) return 'Suitable for Solar';
  if (score >= 50) return 'Conditional Approval';
  return 'Not Recommended';
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Helper function to get site assessment data with ALL data (nulls allowed)
const getSiteAssessmentData = async (queryParams) => {
  const { startDate, endDate, assessmentId } = queryParams;

  let query = {};
  if (assessmentId && assessmentId.match(/^[0-9a-fA-F]{24}$/)) {
    query._id = assessmentId;
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      query.createdAt = { $gte: start, $lte: end };
    }
  }

  // Fetch ALL assessments (no filtering)
  const allAssessments = await PreAssessment.find(query)
    .populate('clientId', 'contactFirstName contactLastName contactNumber client_type')
    .populate('addressId')
    .sort({ createdAt: -1 });

  console.log(`Total assessments: ${allAssessments.length}`);

  // Process ALL assessments - show whatever data is available (null for missing)
  const processedAssessments = allAssessments.map(a => {
    const results = a.assessmentResults || {};
    const peakSunHours = results.peakSunHours || null;
    const avgIrradiance = results.averageIrradiance || null;
    const maxIrradiance = results.maxIrradiance || null;
    const minIrradiance = results.minIrradiance || null;
    const shadingPercentage = results.shadingPercentage || null;
    const avgTemperature = results.averageTemperature || null;
    const maxTemperature = results.maxTemperature || null;
    const minTemperature = results.minTemperature || null;
    const temperatureDerating = results.temperatureDerating || 0;
    const avgHumidity = results.averageHumidity || null;
    const maxHumidity = results.maxHumidity || null;
    const minHumidity = results.minHumidity || null;
    const totalReadings = results.totalReadings || a.totalReadings || 0;
    const dataCollectionStart = results.dataCollectionStart || a.dataCollectionStart;
    const dataCollectionEnd = results.dataCollectionEnd || a.dataCollectionEnd;

    // Get ratings (will be null if data missing)
    const irradianceRating = getRating(avgIrradiance, ASSESSMENT_RESULTS_SUMMARY.IRRADIANCE);
    const tempRating = getRating(avgTemperature, ASSESSMENT_RESULTS_SUMMARY.TEMPERATURE);
    const humidityRating = getRating(avgHumidity, ASSESSMENT_RESULTS_SUMMARY.HUMIDITY);
    const shadingRating = getRating(shadingPercentage, ASSESSMENT_RESULTS_SUMMARY.SHADING_IMPACT);

    // Calculate score (will be null if data missing)
    let suitabilityScore = results.summary?.siteSuitabilityScore || null;
    if (suitabilityScore === null && peakSunHours !== null && shadingPercentage !== null) {
      suitabilityScore = calculateSuitabilityScore(peakSunHours, shadingPercentage, temperatureDerating);
    }

    const suitabilityRating = getRating(suitabilityScore, ASSESSMENT_RESULTS_SUMMARY.SITE_SUITABILITY);

    // Get status number and display
    const statusNum = getStatusNumber(a.assessmentStatus);
    const statusDisplay = ASSESSMENT_STATUS_DISPLAY[statusNum] || a.assessmentStatus;

    // Get roof area from either engineerAssessment or direct fields
    const roofLength = a.engineerAssessment?.roofLength || a.roofLength;
    const roofWidth = a.engineerAssessment?.roofWidth || a.roofWidth;
    const roofArea = roofLength && roofWidth ? (roofLength * roofWidth).toFixed(1) : null;

    return {
      bookingReference: a.bookingReference || 'N/A',
      statusNumber: statusNum,
      statusDisplay: statusDisplay,
      clientName: `${a.clientId?.contactFirstName || ''} ${a.clientId?.contactLastName || ''}`.trim() || 'N/A',
      clientContact: a.clientId?.contactNumber || 'N/A',
      clientType: a.clientId?.client_type || 'N/A',
      address: a.addressId ? `${a.addressId.houseOrBuilding || ''}, ${a.addressId.street || ''}, ${a.addressId.barangay || ''}, ${a.addressId.cityMunicipality || ''}`.replace(/^,\s*|\s*,\s*$/g, '') : 'N/A',
      propertyType: a.propertyType || 'N/A',
      desiredCapacity: a.desiredCapacity || 'N/A',
      roofArea: roofArea,
      roofCondition: a.engineerAssessment?.roofCondition || 'N/A',
      structuralIntegrity: a.engineerAssessment?.structuralIntegrity || 'N/A',
      // IoT Data (will be null if not available)
      dataCollectionStart: dataCollectionStart,
      dataCollectionEnd: dataCollectionEnd,
      totalReadings: totalReadings,
      // Irradiance
      averageIrradiance: avgIrradiance,
      maxIrradiance: maxIrradiance,
      minIrradiance: minIrradiance,
      irradianceRating: irradianceRating?.label || null,
      peakSunHours: peakSunHours,
      // Temperature
      averageTemperature: avgTemperature,
      maxTemperature: maxTemperature,
      minTemperature: minTemperature,
      temperatureRating: tempRating?.label || null,
      temperatureDerating: temperatureDerating,
      // Humidity
      averageHumidity: avgHumidity,
      maxHumidity: maxHumidity,
      minHumidity: minHumidity,
      humidityRating: humidityRating?.label || null,
      // Shading
      shadingPercentage: shadingPercentage,
      shadingRating: shadingRating?.label || null,
      // Results
      suitabilityScore: suitabilityScore,
      suitabilityRating: suitabilityRating?.label || null,
      recommendation: getRecommendation(suitabilityScore),
      assessmentStatus: a.assessmentStatus,
      assessmentDate: a.completedAt || a.updatedAt || a.createdAt,
      // Additional info
      recommendedSystemSize: results.summary?.recommendedSystemSize || a.recommendedSystemType,
      estimatedAnnualProduction: results.summary?.estimatedAnnualProduction || a.estimatedAnnualProduction,
      estimatedAnnualSavings: results.summary?.estimatedAnnualSavings || a.estimatedAnnualSavings,
      paybackPeriod: results.summary?.paybackPeriodYears || a.paybackPeriod,
      co2Offset: results.summary?.co2OffsetTonsPerYear || a.co2Offset
    };
  });

  // Calculate statistics (only from assessments that have actual data)
  const assessmentsWithScore = processedAssessments.filter(a => a.suitabilityScore !== null);
  const suitableSites = assessmentsWithScore.filter(a => a.suitabilityScore >= 70).length;
  const conditionalSites = assessmentsWithScore.filter(a => a.suitabilityScore >= 50 && a.suitabilityScore < 70).length;
  const notSuitable = assessmentsWithScore.filter(a => a.suitabilityScore < 50).length;

  // Count assessments with missing data
  const assessmentsWithPeakSun = processedAssessments.filter(a => a.peakSunHours !== null);
  const assessmentsWithIoTData = processedAssessments.filter(a => a.averageIrradiance !== null && a.averageTemperature !== null);

  const avgPeakSunHours = assessmentsWithPeakSun.length > 0
    ? assessmentsWithPeakSun.reduce((sum, a) => sum + a.peakSunHours, 0) / assessmentsWithPeakSun.length
    : 0;

  const assessmentsWithShading = processedAssessments.filter(a => a.shadingPercentage !== null);
  const avgShading = assessmentsWithShading.length > 0
    ? assessmentsWithShading.reduce((sum, a) => sum + a.shadingPercentage, 0) / assessmentsWithShading.length
    : 0;

  const assessmentsWithIrradiance = processedAssessments.filter(a => a.averageIrradiance !== null);
  const avgIrradiance = assessmentsWithIrradiance.length > 0
    ? assessmentsWithIrradiance.reduce((sum, a) => sum + a.averageIrradiance, 0) / assessmentsWithIrradiance.length
    : 0;

  const assessmentsWithTemp = processedAssessments.filter(a => a.averageTemperature !== null);
  const avgTemperature = assessmentsWithTemp.length > 0
    ? assessmentsWithTemp.reduce((sum, a) => sum + a.averageTemperature, 0) / assessmentsWithTemp.length
    : 0;

  const assessmentsWithHumidity = processedAssessments.filter(a => a.averageHumidity !== null);
  const avgHumidity = assessmentsWithHumidity.length > 0
    ? assessmentsWithHumidity.reduce((sum, a) => sum + a.averageHumidity, 0) / assessmentsWithHumidity.length
    : 0;

  // Status distribution (all assessments)
  const statusDistribution = {};
  for (let i = 1; i <= 12; i++) {
    const count = processedAssessments.filter(a => a.statusNumber === i).length;
    if (count > 0) {
      statusDistribution[ASSESSMENT_STATUS_DISPLAY[i]] = count;
    }
  }

  return {
    title: 'Site Assessment Report',
    generatedAt: new Date(),
    dateRange: { startDate, endDate },
    companyInfo: COMPANY_INFO,
    summary: {
      totalAssessments: processedAssessments.length,
      assessmentsWithIoTData: assessmentsWithIoTData.length,
      assessmentsWithoutIoTData: processedAssessments.length - assessmentsWithIoTData.length,
      suitableSites,
      conditionalSites,
      notSuitable,
      suitabilityRate: processedAssessments.length > 0 ? ((suitableSites / processedAssessments.length) * 100).toFixed(1) : 0,
      averagePeakSunHours: avgPeakSunHours.toFixed(1),
      averageShadingPercentage: avgShading.toFixed(1),
      averageIrradiance: avgIrradiance.toFixed(0),
      averageTemperature: avgTemperature.toFixed(1),
      averageHumidity: avgHumidity.toFixed(0),
      statusDistribution
    },
    assessments: processedAssessments
  };
};

// ============ SITE ASSESSMENT REPORTS ============

// @desc    Get Site Assessment Report
// @route   GET /api/admin/reports/site-assessment
// @access  Private (Admin)
exports.getSiteAssessmentReport = async (req, res) => {
  try {
    console.log('[SiteAssessment] Fetching report with params:', req.query);
    const reportData = await getSiteAssessmentData(req.query);
    return res.json({ success: true, report: reportData });
  } catch (error) {
    console.error('[SiteAssessment] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate site assessment report',
      error: error.message
    });
  }
};

// @desc    Export Site Assessment Report
// @route   POST /api/admin/reports/export (with type: site-assessment)
// @access  Private (Admin)
exports.exportSiteAssessmentReport = async (req, res) => {
  try {
    const { format, data } = req.body;

    if (!format || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: format and data are required'
      });
    }

    if (format === 'csv') {
      // Company header rows
      let csvContent = '';
      csvContent += `${COMPANY_INFO.name}\n`;
      csvContent += `${COMPANY_INFO.address}\n`;
      csvContent += `${COMPANY_INFO.tagline}\n`;
      csvContent += `Report Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Report Type: Site Assessment Report\n`;
      csvContent += `Date Range: ${data.dateRange?.startDate || 'All'} to ${data.dateRange?.endDate || 'All'}\n`;
      csvContent += `\n`;

      // Updated headers - removed Status # and Status
      const headers = [
        'Booking Reference', 'Client Name', 'Contact', 'Client Type',
        'Property Type', 'Desired Capacity', 'Address', 'Roof Area (m²)', 'Roof Condition',
        'Structural Integrity', 'Data Collection Start', 'Data Collection End', 'Total Readings',
        'Avg Irradiance (W/m²)', 'Irradiance Rating', 'Peak Sun Hours (hrs)',
        'Avg Temp (°C)', 'Temp Rating', 'Temp Derating (%)',
        'Avg Humidity (%)', 'Humidity Rating',
        'Shading (%)', 'Shading Rating',
        'Suitability Score', 'Suitability Rating', 'Recommendation',
        'Recommended System Size', 'Est. Annual Production (kWh)', 'Est. Annual Savings (₱)',
        'Payback Period (yrs)', 'CO2 Offset (tons/yr)', 'Assessment Date'
      ];

      const rows = (data.assessments || []).map(a => [
        `"${(a.bookingReference || 'N/A').replace(/"/g, '""')}"`,
        `"${(a.clientName || 'N/A').replace(/"/g, '""')}"`,
        `"${(a.clientContact || 'N/A').replace(/"/g, '""')}"`,
        `"${(a.clientType || 'N/A').replace(/"/g, '""')}"`,
        a.propertyType || 'N/A',
        a.desiredCapacity || 'N/A',
        `"${(a.address || 'N/A').replace(/"/g, '""')}"`,
        a.roofArea || 'N/A',
        a.roofCondition || 'N/A',
        a.structuralIntegrity || 'N/A',
        a.dataCollectionStart ? new Date(a.dataCollectionStart).toLocaleDateString() : 'N/A',
        a.dataCollectionEnd ? new Date(a.dataCollectionEnd).toLocaleDateString() : 'N/A',
        a.totalReadings || 0,
        a.averageIrradiance ? `${a.averageIrradiance.toFixed(0)}` : 'N/A',
        a.irradianceRating || 'N/A',
        a.peakSunHours ? `${a.peakSunHours.toFixed(1)}` : 'N/A',
        a.averageTemperature ? `${a.averageTemperature.toFixed(1)}` : 'N/A',
        a.temperatureRating || 'N/A',
        a.temperatureDerating ? `${a.temperatureDerating.toFixed(1)}` : 'N/A',
        a.averageHumidity ? `${a.averageHumidity.toFixed(0)}` : 'N/A',
        a.humidityRating || 'N/A',
        a.shadingPercentage ? `${a.shadingPercentage.toFixed(0)}` : 'N/A',
        a.shadingRating || 'N/A',
        a.suitabilityScore || 'N/A',
        a.suitabilityRating || 'N/A',
        a.recommendation || 'N/A',
        a.recommendedSystemSize || 'N/A',
        a.estimatedAnnualProduction ? `${a.estimatedAnnualProduction.toFixed(0)}` : 'N/A',
        a.estimatedAnnualSavings ? `${a.estimatedAnnualSavings.toFixed(0)}` : 'N/A',
        a.paybackPeriod ? `${a.paybackPeriod.toFixed(1)}` : 'N/A',
        a.co2Offset ? `${a.co2Offset.toFixed(1)}` : 'N/A',
        a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString() : 'N/A'
      ]);

      // Add summary rows
      csvContent += `SUMMARY STATISTICS\n`;
      csvContent += `Total Assessments,${data.summary?.totalAssessments || 0}\n`;
      csvContent += `Assessments with IoT Data,${data.summary?.assessmentsWithIoTData || 0}\n`;
      csvContent += `Assessments without IoT Data,${data.summary?.assessmentsWithoutIoTData || 0}\n`;
      csvContent += `Suitable Sites,${data.summary?.suitableSites || 0}\n`;
      csvContent += `Conditional Sites,${data.summary?.conditionalSites || 0}\n`;
      csvContent += `Not Suitable,${data.summary?.notSuitable || 0}\n`;
      csvContent += `Suitability Rate,${data.summary?.suitabilityRate || 0}%\n`;
      csvContent += `Average Peak Sun Hours,${data.summary?.averagePeakSunHours || 0} hrs\n`;
      csvContent += `Average Shading,${data.summary?.averageShadingPercentage || 0}%\n`;
      csvContent += `Average Irradiance,${data.summary?.averageIrradiance || 0} W/m²\n`;
      csvContent += `Average Temperature,${data.summary?.averageTemperature || 0}°C\n`;
      csvContent += `Average Humidity,${data.summary?.averageHumidity || 0}%\n`;
      csvContent += `\n`;

      csvContent += `STATUS DISTRIBUTION\n`;
      for (const [status, count] of Object.entries(data.summary?.statusDistribution || {})) {
        csvContent += `${status},${count}\n`;
      }
      csvContent += `\n`;

      csvContent += `ALL ASSESSMENTS\n`;
      csvContent += headers.join(',') + '\n';
      csvContent += rows.map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=site-assessment-report-${Date.now()}.csv`);
      return res.send(csvContent);
    }

    // Update the PDF export section for Site Assessment Report (around line 500-600)

    if (format === 'pdf') {
      if (!PDFDocument) {
        return res.status(501).json({ message: 'PDF export not available. Install pdfkit.' });
      }

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=site-assessment-report-${Date.now()}.pdf`);
      doc.pipe(res);

      // Add Company Header
      addCompanyHeaderToPDF(doc);

      // Report Title
      doc.fontSize(16).font('Helvetica-Bold').text('Site Assessment Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Date Range: ${data.dateRange?.startDate || 'All'} to ${data.dateRange?.endDate || 'All'}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(9).text(`Note: Shows all assessments. "N/A" indicates data not yet available.`, { align: 'center', color: 'gray' });
      doc.moveDown();
      doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Summary Statistics', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Assessments: ${data.summary?.totalAssessments || 0}`);
      doc.text(`Assessments with IoT Data: ${data.summary?.assessmentsWithIoTData || 0}`);
      doc.text(`Assessments without IoT Data: ${data.summary?.assessmentsWithoutIoTData || 0}`);
      doc.moveDown(0.5);
      doc.text(`Suitable Sites: ${data.summary?.suitableSites || 0}`);
      doc.text(`Conditional Sites: ${data.summary?.conditionalSites || 0}`);
      doc.text(`Not Suitable: ${data.summary?.notSuitable || 0}`);
      doc.text(`Suitability Rate: ${data.summary?.suitabilityRate || 0}%`);
      doc.moveDown(0.5);
      doc.text(`Average Peak Sun Hours: ${data.summary?.averagePeakSunHours || 0} hrs`);
      doc.text(`Average Irradiance: ${data.summary?.averageIrradiance || 0} W/m²`);
      doc.text(`Average Temperature: ${data.summary?.averageTemperature || 0}°C`);
      doc.text(`Average Humidity: ${data.summary?.averageHumidity || 0}%`);
      doc.moveDown();

      // Status Distribution
      doc.fontSize(12).font('Helvetica-Bold').text('Status Distribution', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');
      for (const [status, count] of Object.entries(data.summary?.statusDistribution || {})) {
        doc.text(`${status}: ${count}`);
      }
      doc.moveDown();

      // Detailed Table - ONLY SPECIFIED FIELDS
      if (data.assessments && data.assessments.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Assessment Details', { underline: true });
        doc.moveDown(0.5);

        // ONLY these fields: Booking Ref, Client, Contact, Client Type, Property Type, Desired Capacity, Address, Roof Area
        const headers_pdf = ['Booking Ref', 'Client', 'Contact', 'Client Type', 'Property Type', 'Desired Capacity', 'Address', 'Roof Area'];
        // Adjusted column widths for better fit
        const colWidths = [50, 60, 55, 45, 50, 50, 100, 45];
        let x = 50;
        let y = doc.y;

        doc.fontSize(7).font('Helvetica-Bold');
        headers_pdf.forEach((col, i) => {
          doc.text(col, x, y, { width: colWidths[i] });
          x += colWidths[i];
        });
        y += 15;

        doc.fontSize(6).font('Helvetica');
        (data.assessments || []).forEach(a => {
          if (y > 750) {
            doc.addPage();
            y = 50;
            x = 50;
            doc.fontSize(7).font('Helvetica-Bold');
            headers_pdf.forEach((col, i) => {
              doc.text(col, x, y, { width: colWidths[i] });
              x += colWidths[i];
            });
            y += 15;
            doc.fontSize(6).font('Helvetica');
          }
          x = 50;
          // Booking Ref
          doc.text((a.bookingReference || 'N/A').substring(0, 10), x, y, { width: colWidths[0] });
          x += colWidths[0];
          // Client
          doc.text((a.clientName || 'N/A').substring(0, 12), x, y, { width: colWidths[1] });
          x += colWidths[1];
          // Contact
          doc.text((a.clientContact || 'N/A').substring(0, 12), x, y, { width: colWidths[2] });
          x += colWidths[2];
          // Client Type
          doc.text((a.clientType || 'N/A').substring(0, 10), x, y, { width: colWidths[3] });
          x += colWidths[3];
          // Property Type
          doc.text((a.propertyType || 'N/A').substring(0, 10), x, y, { width: colWidths[4] });
          x += colWidths[4];
          // Desired Capacity
          doc.text((a.desiredCapacity || 'N/A').substring(0, 10), x, y, { width: colWidths[5] });
          x += colWidths[5];
          // Address (truncated to fit)
          let addressText = (a.address || 'N/A');
          if (addressText.length > 20) addressText = addressText.substring(0, 18) + '...';
          doc.text(addressText, x, y, { width: colWidths[6] });
          x += colWidths[6];
          // Roof Area
          doc.text(a.roofArea ? `${a.roofArea} m²` : 'N/A', x, y, { width: colWidths[7] });
          y += 12;
        });
      }

      // Footer
      doc.moveDown();
      doc.fontSize(8).font('Helvetica-Oblique').text(`Generated by ${COMPANY_INFO.name} - ${COMPANY_INFO.address}`, { align: 'center' });

      doc.end();
      return;
    }

    if (format === 'xlsx') {
      if (!ExcelJS) {
        return res.status(501).json({ message: 'Excel export not available. Install exceljs.' });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Site Assessment Report');

      // Add company header
      const startRow = addCompanyHeaderToWorksheet(worksheet, 'Site Assessment Report');

      // Summary Section
      let currentRow = startRow;
      worksheet.mergeCells(`A${currentRow}:AF${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'SUMMARY STATISTICS';
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      currentRow++;

      worksheet.addRow(['Total Assessments', data.summary?.totalAssessments || 0]);
      worksheet.addRow(['Assessments with IoT Data', data.summary?.assessmentsWithIoTData || 0]);
      worksheet.addRow(['Assessments without IoT Data', data.summary?.assessmentsWithoutIoTData || 0]);
      worksheet.addRow([]);
      worksheet.addRow(['Suitable Sites', data.summary?.suitableSites || 0]);
      worksheet.addRow(['Conditional Sites', data.summary?.conditionalSites || 0]);
      worksheet.addRow(['Not Suitable', data.summary?.notSuitable || 0]);
      worksheet.addRow(['Suitability Rate', `${data.summary?.suitabilityRate || 0}%`]);
      worksheet.addRow([]);
      worksheet.addRow(['Average Peak Sun Hours', `${data.summary?.averagePeakSunHours || 0} hrs`]);
      worksheet.addRow(['Average Shading', `${data.summary?.averageShadingPercentage || 0}%`]);
      worksheet.addRow(['Average Irradiance', `${data.summary?.averageIrradiance || 0} W/m²`]);
      worksheet.addRow(['Average Temperature', `${data.summary?.averageTemperature || 0}°C`]);
      worksheet.addRow(['Average Humidity', `${data.summary?.averageHumidity || 0}%`]);

      // Status Distribution
      worksheet.addRow([]);
      worksheet.addRow(['STATUS DISTRIBUTION']);
      for (const [status, count] of Object.entries(data.summary?.statusDistribution || {})) {
        worksheet.addRow([status, count]);
      }

      // Detailed assessments - Updated headers (removed Status # and Status)
      if (data.assessments && data.assessments.length > 0) {
        worksheet.addRow([]);
        worksheet.addRow(['ALL ASSESSMENTS']);

        // Updated headers - removed Status # and Status
        const headers_excel = [
          'Booking Ref', 'Client Name', 'Contact', 'Client Type',
          'Property Type', 'Desired Capacity', 'Address', 'Roof Area (m²)', 'Roof Condition',
          'Structural Integrity', 'Data Start', 'Data End', 'Readings',
          'Avg Irradiance', 'Irradiance Rating', 'Peak Sun Hours',
          'Avg Temp (°C)', 'Temp Rating', 'Temp Derating (%)',
          'Avg Humidity (%)', 'Humidity Rating',
          'Shading (%)', 'Shading Rating',
          'Suitability Score', 'Suitability Rating', 'Recommendation',
          'Recommended System', 'Est. Annual Production', 'Est. Annual Savings',
          'Payback Period', 'CO2 Offset', 'Date'
        ];
        worksheet.addRow(headers_excel);

        // Style headers
        const headerRow = worksheet.getRow(worksheet.rowCount);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        (data.assessments || []).forEach(a => {
          worksheet.addRow([
            a.bookingReference || 'N/A',
            a.clientName || 'N/A',
            a.clientContact || 'N/A',
            a.clientType || 'N/A',
            a.propertyType || 'N/A',
            a.desiredCapacity || 'N/A',
            a.address || 'N/A',
            a.roofArea || 'N/A',
            a.roofCondition || 'N/A',
            a.structuralIntegrity || 'N/A',
            a.dataCollectionStart ? new Date(a.dataCollectionStart).toLocaleDateString() : 'N/A',
            a.dataCollectionEnd ? new Date(a.dataCollectionEnd).toLocaleDateString() : 'N/A',
            a.totalReadings || 0,
            a.averageIrradiance ? a.averageIrradiance.toFixed(0) : 'N/A',
            a.irradianceRating || 'N/A',
            a.peakSunHours ? a.peakSunHours.toFixed(1) : 'N/A',
            a.averageTemperature ? a.averageTemperature.toFixed(1) : 'N/A',
            a.temperatureRating || 'N/A',
            a.temperatureDerating ? a.temperatureDerating.toFixed(1) : 'N/A',
            a.averageHumidity ? a.averageHumidity.toFixed(0) : 'N/A',
            a.humidityRating || 'N/A',
            a.shadingPercentage ? a.shadingPercentage.toFixed(0) : 'N/A',
            a.shadingRating || 'N/A',
            a.suitabilityScore || 'N/A',
            a.suitabilityRating || 'N/A',
            a.recommendation || 'N/A',
            a.recommendedSystemSize || 'N/A',
            a.estimatedAnnualProduction ? a.estimatedAnnualProduction.toFixed(0) : 'N/A',
            a.estimatedAnnualSavings ? a.estimatedAnnualSavings.toFixed(0) : 'N/A',
            a.paybackPeriod ? a.paybackPeriod.toFixed(1) : 'N/A',
            a.co2Offset ? a.co2Offset.toFixed(1) : 'N/A',
            a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString() : 'N/A'
          ]);
        });
      }

      // Auto-fit columns
      worksheet.columns.forEach(col => { col.width = 18; });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=site-assessment-report-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    res.status(400).json({ message: `Invalid format '${format}'. Use csv, pdf, or xlsx` });

  } catch (error) {
    console.error('[Export SiteAssessment] Error:', error);
    res.status(500).json({ message: 'Failed to export report', error: error.message });
  }
};

// ============ PROJECT SUMMARY REPORTS ============

// Helper function to get project summary data
const getProjectSummaryData = async (queryParams) => {
  const { startDate, endDate, projectId } = queryParams;

  let query = {};
  if (projectId && projectId.match(/^[0-9a-fA-F]{24}$/)) {
    query._id = projectId;
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      query.createdAt = { $gte: start, $lte: end };
    }
  }

  const projects = await Project.find(query)
    .populate('clientId', 'contactFirstName contactLastName contactNumber client_type')
    .populate('assignedEngineerId', 'firstName lastName email')
    .sort({ createdAt: -1 });

  const totalProjects = projects.length;
  const inProgress = projects.filter(p => p.status === 'in_progress').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const pending = projects.filter(p => p.status === 'pending' || p.status === 'quoted' || p.status === 'approved').length;
  const fullPaid = projects.filter(p => p.status === 'full_paid').length;
  const initialPaid = projects.filter(p => p.status === 'initial_paid').length;

  const totalAmount = projects.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const totalPaid = projects.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const averageProgress = projects.length > 0
    ? projects.reduce((sum, p) => {
      let progress = 0;
      if (p.status === 'completed') progress = 100;
      else if (p.status === 'in_progress') progress = 50;
      else if (p.status === 'full_paid') progress = 30;
      else if (p.status === 'initial_paid') progress = 15;
      else progress = 5;
      return sum + progress;
    }, 0) / projects.length
    : 0;

  return {
    title: 'Project Summary Report',
    generatedAt: new Date(),
    dateRange: { startDate, endDate },
    companyInfo: COMPANY_INFO,
    summary: {
      totalProjects,
      inProgress,
      completed,
      pending,
      fullPaid,
      initialPaid,
      completionRate: totalProjects > 0 ? ((completed / totalProjects) * 100).toFixed(1) : 0,
      totalContractAmount: totalAmount,
      totalAmountPaid: totalPaid,
      outstandingBalance: totalAmount - totalPaid,
      averageProgress: averageProgress.toFixed(1)
    },
    projects: projects.map(p => ({
      projectName: p.projectName || 'N/A',
      projectReference: p.projectReference || 'N/A',
      clientName: `${p.clientId?.contactFirstName || ''} ${p.clientId?.contactLastName || ''}`.trim() || 'N/A',
      clientContact: p.clientId?.contactNumber || 'N/A',
      clientType: p.clientId?.client_type || 'N/A',
      systemSize: p.systemSize || 'N/A',
      systemType: p.systemType || 'N/A',
      status: p.status === 'in_progress' ? 'In Progress' :
        p.status === 'completed' ? 'Completed' :
          p.status === 'full_paid' ? 'Full Payment Received' :
            p.status === 'initial_paid' ? 'Initial Payment Received' :
              p.status === 'quoted' ? 'Quoted' :
                p.status === 'approved' ? 'Approved' : 'Pending',
      totalCost: p.totalCost || 0,
      amountPaid: p.amountPaid || 0,
      balance: (p.totalCost || 0) - (p.amountPaid || 0),
      paymentPreference: p.paymentPreference || 'N/A',
      startDate: p.startDate,
      estimatedCompletionDate: p.estimatedCompletionDate,
      actualCompletionDate: p.actualCompletionDate,
      assignedEngineer: p.assignedEngineerId ? `${p.assignedEngineerId.firstName} ${p.assignedEngineerId.lastName}` : 'Not Assigned'
    }))
  };
};

// @desc    Get Project Summary Report
// @route   GET /api/admin/reports/project-summary
// @access  Private (Admin)
exports.getProjectSummaryReport = async (req, res) => {
  try {
    console.log('[ProjectSummary] Fetching report with params:', req.query);
    const reportData = await getProjectSummaryData(req.query);
    return res.json({ success: true, report: reportData });
  } catch (error) {
    console.error('[ProjectSummary] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate project summary report',
      error: error.message
    });
  }
};

// @desc    Export Project Summary Report
// @route   POST /api/admin/reports/export (with type: project-summary)
// @access  Private (Admin)
exports.exportProjectSummaryReport = async (req, res) => {
  try {
    const { format, data } = req.body;

    if (!format || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: format and data are required'
      });
    }

    if (format === 'csv') {
      // Company header
      let csvContent = '';
      csvContent += `${COMPANY_INFO.name}\n`;
      csvContent += `${COMPANY_INFO.address}\n`;
      csvContent += `${COMPANY_INFO.tagline}\n`;
      csvContent += `Report Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Report Type: Project Summary Report\n`;
      csvContent += `Date Range: ${data.dateRange?.startDate || 'All'} to ${data.dateRange?.endDate || 'All'}\n`;
      csvContent += `\n`;

      csvContent += `SUMMARY\n`;
      csvContent += `Total Projects,${data.summary?.totalProjects || 0}\n`;
      csvContent += `In Progress,${data.summary?.inProgress || 0}\n`;
      csvContent += `Completed,${data.summary?.completed || 0}\n`;
      csvContent += `Pending,${data.summary?.pending || 0}\n`;
      csvContent += `Full Payment Received,${data.summary?.fullPaid || 0}\n`;
      csvContent += `Initial Payment Received,${data.summary?.initialPaid || 0}\n`;
      csvContent += `Completion Rate,${data.summary?.completionRate || 0}%\n`;
      csvContent += `Total Contract Amount,${data.summary?.totalContractAmount || 0}\n`;
      csvContent += `Total Amount Paid,${data.summary?.totalAmountPaid || 0}\n`;
      csvContent += `Outstanding Balance,${data.summary?.outstandingBalance || 0}\n`;
      csvContent += `Average Progress,${data.summary?.averageProgress || 0}%\n`;
      csvContent += `\n`;

      csvContent += `PROJECT DETAILS\n`;
      const headers = [
        'Project Name', 'Reference', 'Client Name', 'Contact', 'Client Type',
        'System Size (kWp)', 'System Type', 'Status', 'Total Cost', 'Amount Paid',
        'Balance', 'Payment Preference', 'Start Date', 'Est. Completion', 'Actual Completion', 'Engineer'
      ];
      csvContent += headers.join(',') + '\n';

      const rows = (data.projects || []).map(p => [
        `"${(p.projectName || 'N/A').replace(/"/g, '""')}"`,
        `"${(p.projectReference || 'N/A').replace(/"/g, '""')}"`,
        `"${(p.clientName || 'N/A').replace(/"/g, '""')}"`,
        `"${(p.clientContact || 'N/A').replace(/"/g, '""')}"`,
        `"${(p.clientType || 'N/A').replace(/"/g, '""')}"`,
        p.systemSize !== 'N/A' ? `${p.systemSize} kWp` : 'N/A',
        p.systemType !== 'N/A' ? p.systemType : 'N/A',
        p.status || 'N/A',
        p.totalCost || 0,
        p.amountPaid || 0,
        p.balance || 0,
        p.paymentPreference || 'N/A',
        p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A',
        p.estimatedCompletionDate ? new Date(p.estimatedCompletionDate).toLocaleDateString() : 'N/A',
        p.actualCompletionDate ? new Date(p.actualCompletionDate).toLocaleDateString() : 'N/A',
        `"${(p.assignedEngineer || 'N/A').replace(/"/g, '""')}"`
      ]);

      csvContent += rows.map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=project-summary-report-${Date.now()}.csv`);
      return res.send(csvContent);
    }

    if (format === 'pdf') {
      if (!PDFDocument) {
        return res.status(501).json({ message: 'PDF export not available. Install pdfkit.' });
      }

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=project-summary-report-${Date.now()}.pdf`);
      doc.pipe(res);

      // Add Company Header
      addCompanyHeaderToPDF(doc);

      doc.fontSize(16).font('Helvetica-Bold').text('Project Summary Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Projects: ${data.summary?.totalProjects || 0}`);
      doc.text(`In Progress: ${data.summary?.inProgress || 0}`);
      doc.text(`Completed: ${data.summary?.completed || 0}`);
      doc.text(`Completion Rate: ${data.summary?.completionRate || 0}%`);
      doc.text(`Total Contract: ${formatCurrency(data.summary?.totalContractAmount || 0)}`);
      doc.text(`Total Paid: ${formatCurrency(data.summary?.totalAmountPaid || 0)}`);
      doc.moveDown();

      // Footer
      doc.fontSize(8).font('Helvetica-Oblique').text(`Generated by ${COMPANY_INFO.name} - ${COMPANY_INFO.address}`, { align: 'center' });

      doc.end();
      return;
    }

    if (format === 'xlsx') {
      if (!ExcelJS) {
        return res.status(501).json({ message: 'Excel export not available. Install exceljs.' });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Project Summary Report');

      // Add company header
      addCompanyHeaderToWorksheet(worksheet, 'Project Summary Report');

      worksheet.addRow([]);
      worksheet.addRow(['SUMMARY']);
      worksheet.getCell('A7').font = { bold: true };
      worksheet.addRow(['Total Projects', data.summary?.totalProjects || 0]);
      worksheet.addRow(['In Progress', data.summary?.inProgress || 0]);
      worksheet.addRow(['Completed', data.summary?.completed || 0]);
      worksheet.addRow(['Completion Rate', `${data.summary?.completionRate || 0}%`]);
      worksheet.addRow(['Total Contract Amount', data.summary?.totalContractAmount || 0]);
      worksheet.addRow(['Total Amount Paid', data.summary?.totalAmountPaid || 0]);

      worksheet.addRow([]);
      worksheet.addRow(['PROJECT DETAILS']);
      worksheet.getCell('A15').font = { bold: true };

      const headers_excel = [
        'Project Name', 'Reference', 'Client', 'Contact', 'Type', 'System Size',
        'System Type', 'Status', 'Total Cost', 'Paid', 'Balance', 'Payment Preference',
        'Start Date', 'Est. Completion', 'Actual Completion', 'Engineer'
      ];
      worksheet.addRow(headers_excel);

      (data.projects || []).forEach(p => {
        worksheet.addRow([
          p.projectName || 'N/A',
          p.projectReference || 'N/A',
          p.clientName || 'N/A',
          p.clientContact || 'N/A',
          p.clientType || 'N/A',
          p.systemSize !== 'N/A' ? `${p.systemSize} kWp` : 'N/A',
          p.systemType !== 'N/A' ? p.systemType : 'N/A',
          p.status || 'N/A',
          p.totalCost || 0,
          p.amountPaid || 0,
          p.balance || 0,
          p.paymentPreference || 'N/A',
          p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A',
          p.estimatedCompletionDate ? new Date(p.estimatedCompletionDate).toLocaleDateString() : 'N/A',
          p.actualCompletionDate ? new Date(p.actualCompletionDate).toLocaleDateString() : 'N/A',
          p.assignedEngineer || 'N/A'
        ]);
      });

      worksheet.columns.forEach(col => { col.width = 18; });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=project-summary-report-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    res.status(400).json({ message: `Invalid format '${format}'. Use csv, pdf, or xlsx` });

  } catch (error) {
    console.error('[Export ProjectSummary] Error:', error);
    res.status(500).json({ message: 'Failed to export report', error: error.message });
  }
};

// ============ FINANCIAL REPORTS ============

// Helper function to get financial data
const getFinancialData = async (queryParams) => {
  const { startDate, endDate } = queryParams;

  let dateFilter = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    }
  }

  // Get paid pre-assessments
  const preAssessments = await PreAssessment.find({
    paymentStatus: 'paid',
    ...dateFilter
  }).populate('clientId', 'contactFirstName contactLastName client_type');

  // Get projects with payments
  const projects = await Project.find({
    amountPaid: { $gt: 0 },
    ...dateFilter
  }).populate('clientId', 'contactFirstName contactLastName client_type');

  const preRevenue = preAssessments.reduce((sum, a) => sum + (a.assessmentFee || 0), 0);
  const projectRevenue = projects.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const totalRevenue = preRevenue + projectRevenue;

  // Build payment transactions
  const prePayments = preAssessments.map(p => ({
    date: p.paymentCompletedAt || p.confirmedAt || p.updatedAt,
    type: 'Pre-Assessment Fee',
    reference: p.bookingReference,
    invoiceNumber: p.invoiceNumber,
    clientName: `${p.clientId?.contactFirstName || ''} ${p.clientId?.contactLastName || ''}`.trim() || 'N/A',
    clientType: p.clientId?.client_type || 'N/A',
    amount: p.assessmentFee || 0,
    method: p.paymentGateway === 'paymongo' ? 'PayMongo' : (p.paymentMethod || 'Manual').toUpperCase(),
    status: 'Paid'
  }));

  const projectPayments = projects.flatMap(p => {
    const payments = [];

    if (p.initialPayment > 0 && p.amountPaid >= p.initialPayment) {
      payments.push({
        date: p.startDate || p.createdAt,
        type: 'Initial Payment (30%)',
        reference: p.projectReference,
        invoiceNumber: p.invoices?.[0]?.invoiceNumber || 'N/A',
        clientName: `${p.clientId?.contactFirstName || ''} ${p.clientId?.contactLastName || ''}`.trim() || 'N/A',
        clientType: p.clientId?.client_type || 'N/A',
        amount: p.initialPayment,
        method: 'Manual',
        status: 'Paid'
      });
    }

    if (p.progressPayment > 0 && p.amountPaid >= p.initialPayment + p.progressPayment) {
      payments.push({
        date: p.updatedAt,
        type: 'Progress Payment (40%)',
        reference: p.projectReference,
        invoiceNumber: p.invoices?.[1]?.invoiceNumber || 'N/A',
        clientName: `${p.clientId?.contactFirstName || ''} ${p.clientId?.contactLastName || ''}`.trim() || 'N/A',
        clientType: p.clientId?.client_type || 'N/A',
        amount: p.progressPayment,
        method: 'Manual',
        status: 'Paid'
      });
    }

    if (p.finalPayment > 0 && p.amountPaid >= p.totalCost) {
      payments.push({
        date: p.actualCompletionDate || p.updatedAt,
        type: 'Final Payment (30%)',
        reference: p.projectReference,
        invoiceNumber: p.invoices?.[2]?.invoiceNumber || 'N/A',
        clientName: `${p.clientId?.contactFirstName || ''} ${p.clientId?.contactLastName || ''}`.trim() || 'N/A',
        clientType: p.clientId?.client_type || 'N/A',
        amount: p.finalPayment,
        method: 'Manual',
        status: 'Paid'
      });
    }

    if (p.paymentPreference === 'full' && p.amountPaid > 0) {
      payments.push({
        date: p.startDate || p.createdAt,
        type: 'Full Payment (100%)',
        reference: p.projectReference,
        invoiceNumber: p.invoices?.[0]?.invoiceNumber || 'N/A',
        clientName: `${p.clientId?.contactFirstName || ''} ${p.clientId?.contactLastName || ''}`.trim() || 'N/A',
        clientType: p.clientId?.client_type || 'N/A',
        amount: p.amountPaid,
        method: 'Manual',
        status: 'Paid'
      });
    }

    return payments;
  });

  const allPayments = [...prePayments, ...projectPayments].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculate monthly breakdown
  const monthlyData = {};
  allPayments.forEach(p => {
    const month = new Date(p.date).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!monthlyData[month]) monthlyData[month] = 0;
    monthlyData[month] += p.amount;
  });

  return {
    title: 'Financial Report',
    generatedAt: new Date(),
    dateRange: { startDate, endDate },
    companyInfo: COMPANY_INFO,
    summary: {
      totalRevenue,
      preAssessmentRevenue: preRevenue,
      projectRevenue: projectRevenue,
      totalTransactions: allPayments.length,
      preAssessmentCount: preAssessments.length,
      projectCount: projects.length,
      averageTransactionValue: allPayments.length > 0 ? totalRevenue / allPayments.length : 0
    },
    monthlyBreakdown: Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })),
    payments: allPayments
  };
};

// @desc    Get Financial Report
// @route   GET /api/admin/reports/financial
// @access  Private (Admin)
exports.getFinancialReport = async (req, res) => {
  try {
    console.log('[Financial] Fetching report with params:', req.query);
    const reportData = await getFinancialData(req.query);
    return res.json({ success: true, report: reportData });
  } catch (error) {
    console.error('[Financial] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: error.message
    });
  }
};

// @desc    Export Financial Report
// @route   POST /api/admin/reports/export (with type: financial)
// @access  Private (Admin)
exports.exportFinancialReport = async (req, res) => {
  try {
    const { format, data } = req.body;

    if (!format || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: format and data are required'
      });
    }

    if (format === 'csv') {
      let csvContent = '';
      csvContent += `${COMPANY_INFO.name}\n`;
      csvContent += `${COMPANY_INFO.address}\n`;
      csvContent += `${COMPANY_INFO.tagline}\n`;
      csvContent += `Report Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Report Type: Financial Report\n`;
      csvContent += `Date Range: ${data.dateRange?.startDate || 'All'} to ${data.dateRange?.endDate || 'All'}\n`;
      csvContent += `\n`;

      csvContent += `SUMMARY\n`;
      csvContent += `Total Revenue,${data.summary?.totalRevenue || 0}\n`;
      csvContent += `Pre-Assessment Revenue,${data.summary?.preAssessmentRevenue || 0}\n`;
      csvContent += `Project Revenue,${data.summary?.projectRevenue || 0}\n`;
      csvContent += `Total Transactions,${data.summary?.totalTransactions || 0}\n`;
      csvContent += `Average Transaction Value,${data.summary?.averageTransactionValue || 0}\n`;
      csvContent += `\n`;

      csvContent += `MONTHLY BREAKDOWN\n`;
      csvContent += `Month,Amount\n`;
      (data.monthlyBreakdown || []).forEach(m => {
        csvContent += `${m.month},${m.amount}\n`;
      });
      csvContent += `\n`;

      csvContent += `TRANSACTION DETAILS\n`;
      const headers = ['Date', 'Type', 'Reference', 'Invoice #', 'Client Name', 'Client Type', 'Amount', 'Payment Method', 'Status'];
      csvContent += headers.join(',') + '\n';

      const rows = (data.payments || []).map(p => [
        new Date(p.date).toLocaleDateString(),
        p.type,
        p.reference,
        p.invoiceNumber,
        `"${(p.clientName || 'N/A').replace(/"/g, '""')}"`,
        p.clientType || 'N/A',
        p.amount || 0,
        p.method || 'N/A',
        p.status || 'N/A'
      ]);
      csvContent += rows.map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=financial-report-${Date.now()}.csv`);
      return res.send(csvContent);
    }

    if (format === 'pdf') {
      if (!PDFDocument) {
        return res.status(501).json({ message: 'PDF export not available. Install pdfkit.' });
      }

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=financial-report-${Date.now()}.pdf`);
      doc.pipe(res);

      // Add Company Header
      addCompanyHeaderToPDF(doc);

      doc.fontSize(16).font('Helvetica-Bold').text('Financial Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Revenue: ${formatCurrency(data.summary?.totalRevenue || 0)}`);
      doc.text(`Pre-Assessment Revenue: ${formatCurrency(data.summary?.preAssessmentRevenue || 0)}`);
      doc.text(`Project Revenue: ${formatCurrency(data.summary?.projectRevenue || 0)}`);
      doc.text(`Total Transactions: ${data.summary?.totalTransactions || 0}`);
      doc.moveDown();

      // Footer
      doc.fontSize(8).font('Helvetica-Oblique').text(`Generated by ${COMPANY_INFO.name} - ${COMPANY_INFO.address}`, { align: 'center' });

      doc.end();
      return;
    }

    if (format === 'xlsx') {
      if (!ExcelJS) {
        return res.status(501).json({ message: 'Excel export not available. Install exceljs.' });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Financial Report');

      // Add company header
      addCompanyHeaderToWorksheet(worksheet, 'Financial Report');

      worksheet.addRow([]);
      worksheet.addRow(['SUMMARY']);
      worksheet.getCell('A7').font = { bold: true };
      worksheet.addRow(['Total Revenue', data.summary?.totalRevenue || 0]);
      worksheet.addRow(['Pre-Assessment Revenue', data.summary?.preAssessmentRevenue || 0]);
      worksheet.addRow(['Project Revenue', data.summary?.projectRevenue || 0]);
      worksheet.addRow(['Total Transactions', data.summary?.totalTransactions || 0]);

      worksheet.addRow([]);
      worksheet.addRow(['MONTHLY BREAKDOWN']);
      worksheet.getCell('A13').font = { bold: true };
      worksheet.addRow(['Month', 'Amount']);
      (data.monthlyBreakdown || []).forEach(m => {
        worksheet.addRow([m.month, m.amount]);
      });

      worksheet.addRow([]);
      worksheet.addRow(['TRANSACTION DETAILS']);
      worksheet.getCell('A' + (14 + (data.monthlyBreakdown?.length || 0))).font = { bold: true };

      const headers_excel = ['Date', 'Type', 'Reference', 'Invoice #', 'Client Name', 'Client Type', 'Amount', 'Payment Method', 'Status'];
      worksheet.addRow(headers_excel);

      (data.payments || []).forEach(p => {
        worksheet.addRow([
          new Date(p.date).toLocaleDateString(),
          p.type,
          p.reference,
          p.invoiceNumber,
          p.clientName,
          p.clientType || 'N/A',
          p.amount || 0,
          p.method || 'N/A',
          p.status || 'N/A'
        ]);
      });

      worksheet.columns.forEach(col => { col.width = 18; });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=financial-report-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    res.status(400).json({ message: `Invalid format '${format}'. Use csv, pdf, or xlsx` });

  } catch (error) {
    console.error('[Export Financial] Error:', error);
    res.status(500).json({ message: 'Failed to export report', error: error.message });
  }
};

// ============ CLIENT TRANSACTION REPORTS ============

// Helper function to get client transaction data
const getClientTransactionData = async (queryParams) => {
  const { startDate, endDate, clientId } = queryParams;

  let clientFilter = {};
  if (clientId && clientId.match(/^[0-9a-fA-F]{24}$/)) {
    clientFilter._id = clientId;
  }

  const clients = await Client.find(clientFilter);

  let dateFilter = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    }
  }

  const transactions = [];

  for (const client of clients) {
    // Get pre-assessments for this client
    const preAssessments = await PreAssessment.find({
      clientId: client._id,
      ...dateFilter
    });

    preAssessments.forEach(pa => {
      const results = pa.assessmentResults || {};
      transactions.push({
        date: pa.createdAt,
        clientId: client._id,
        clientName: `${client.contactFirstName || ''} ${client.contactLastName || ''}`.trim() || 'N/A',
        clientContact: client.contactNumber || 'N/A',
        clientType: client.client_type || 'N/A',
        transactionType: 'Pre-Assessment Booking',
        reference: pa.bookingReference || 'N/A',
        invoiceNumber: pa.invoiceNumber || 'N/A',
        amount: pa.assessmentFee || 0,
        paymentMethod: pa.paymentGateway === 'paymongo' ? 'PayMongo' : (pa.paymentMethod || 'Manual').toUpperCase(),
        status: pa.paymentStatus === 'paid' ? 'Paid' : pa.paymentStatus === 'for_verification' ? 'For Verification' : 'Pending',
        details: {
          propertyType: pa.propertyType,
          desiredCapacity: pa.desiredCapacity,
          assessmentStatus: pa.assessmentStatus,
          peakSunHours: results.peakSunHours,
          suitabilityScore: results.summary?.siteSuitabilityScore
        }
      });
    });

    // Get projects for this client
    const projects = await Project.find({
      clientId: client._id,
      ...dateFilter
    });

    projects.forEach(project => {
      if (project.amountPaid > 0) {
        transactions.push({
          date: project.startDate || project.createdAt,
          clientId: client._id,
          clientName: `${client.contactFirstName || ''} ${client.contactLastName || ''}`.trim() || 'N/A',
          clientContact: client.contactNumber || 'N/A',
          clientType: client.client_type || 'N/A',
          transactionType: 'Project Payment',
          reference: project.projectReference || 'N/A',
          projectName: project.projectName,
          amount: project.amountPaid,
          paymentMethod: 'Manual',
          status: project.status === 'completed' ? 'Completed' :
            project.status === 'full_paid' ? 'Full Payment Received' : 'In Progress',
          details: {
            totalCost: project.totalCost,
            balance: project.balance,
            systemSize: project.systemSize,
            paymentPreference: project.paymentPreference
          }
        });
      }
    });
  }

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    title: 'Client Transaction Report',
    generatedAt: new Date(),
    dateRange: { startDate, endDate },
    companyInfo: COMPANY_INFO,
    summary: {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      uniqueClients: new Set(transactions.map(t => t.clientId)).size,
      preAssessmentCount: transactions.filter(t => t.transactionType === 'Pre-Assessment Booking').length,
      projectPaymentCount: transactions.filter(t => t.transactionType === 'Project Payment').length
    },
    transactions
  };
};

// @desc    Get Client Transaction Report
// @route   GET /api/admin/reports/client-transaction
// @access  Private (Admin)
exports.getClientTransactionReport = async (req, res) => {
  try {
    console.log('[ClientTransaction] Fetching report with params:', req.query);
    const reportData = await getClientTransactionData(req.query);
    return res.json({ success: true, report: reportData });
  } catch (error) {
    console.error('[ClientTransaction] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate client transaction report',
      error: error.message
    });
  }
};

// @desc    Export Client Transaction Report
// @route   POST /api/admin/reports/export (with type: client-transaction)
// @access  Private (Admin)
exports.exportClientTransactionReport = async (req, res) => {
  try {
    const { format, data } = req.body;

    if (!format || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: format and data are required'
      });
    }

    // Handle both data formats
    let transactions = [];
    let summary = {};

    if (Array.isArray(data)) {
      transactions = data;
      summary = {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      };
    } else if (data.transactions) {
      transactions = data.transactions;
      summary = data.summary || {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of transactions or object with transactions property.'
      });
    }

    if (format === 'csv') {
      let csvContent = '';
      csvContent += `${COMPANY_INFO.name}\n`;
      csvContent += `${COMPANY_INFO.address}\n`;
      csvContent += `${COMPANY_INFO.tagline}\n`;
      csvContent += `Report Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Report Type: Client Transaction Report\n`;
      csvContent += `Date Range: ${data.dateRange?.startDate || 'All'} to ${data.dateRange?.endDate || 'All'}\n`;
      csvContent += `\n`;

      csvContent += `SUMMARY\n`;
      csvContent += `Total Transactions,${summary.totalTransactions}\n`;
      csvContent += `Total Amount,${summary.totalAmount}\n`;
      csvContent += `Unique Clients,${summary.uniqueClients || 0}\n`;
      csvContent += `Pre-Assessment Bookings,${summary.preAssessmentCount || 0}\n`;
      csvContent += `Project Payments,${summary.projectPaymentCount || 0}\n`;
      csvContent += `\n`;

      csvContent += `TRANSACTION DETAILS\n`;
      const headers = ['Date', 'Client Name', 'Contact', 'Client Type', 'Transaction Type', 'Reference', 'Invoice/Project', 'Amount', 'Payment Method', 'Status'];
      csvContent += headers.join(',') + '\n';

      const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        `"${(t.clientName || 'N/A').replace(/"/g, '""')}"`,
        `"${(t.clientContact || 'N/A').replace(/"/g, '""')}"`,
        t.clientType || 'N/A',
        t.transactionType || 'N/A',
        `"${(t.reference || 'N/A').replace(/"/g, '""')}"`,
        `"${(t.invoiceNumber || t.projectName || 'N/A').replace(/"/g, '""')}"`,
        t.amount || 0,
        t.paymentMethod || 'N/A',
        t.status || 'N/A'
      ]);
      csvContent += rows.map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=client-transaction-report-${Date.now()}.csv`);
      return res.send(csvContent);
    }

    if (format === 'pdf') {
      if (!PDFDocument) {
        return res.status(501).json({ message: 'PDF export not available. Install pdfkit.' });
      }

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=client-transaction-report-${Date.now()}.pdf`);
      doc.pipe(res);

      // Add Company Header
      addCompanyHeaderToPDF(doc);

      doc.fontSize(16).font('Helvetica-Bold').text('Client Transaction Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Transactions: ${summary.totalTransactions || 0}`);
      doc.text(`Total Amount: ${formatCurrency(summary.totalAmount || 0)}`);
      doc.text(`Unique Clients: ${summary.uniqueClients || 0}`);
      doc.moveDown();

      // Footer
      doc.fontSize(8).font('Helvetica-Oblique').text(`Generated by ${COMPANY_INFO.name} - ${COMPANY_INFO.address}`, { align: 'center' });

      doc.end();
      return;
    }

    if (format === 'xlsx') {
      if (!ExcelJS) {
        return res.status(501).json({ message: 'Excel export not available. Install exceljs.' });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Client Transaction Report');

      // Add company header
      addCompanyHeaderToWorksheet(worksheet, 'Client Transaction Report');

      worksheet.addRow([]);
      worksheet.addRow(['SUMMARY']);
      worksheet.getCell('A7').font = { bold: true };
      worksheet.addRow(['Total Transactions', summary.totalTransactions || 0]);
      worksheet.addRow(['Total Amount', summary.totalAmount || 0]);
      worksheet.addRow(['Unique Clients', summary.uniqueClients || 0]);
      worksheet.addRow(['Pre-Assessment Bookings', summary.preAssessmentCount || 0]);
      worksheet.addRow(['Project Payments', summary.projectPaymentCount || 0]);

      worksheet.addRow([]);
      worksheet.addRow(['TRANSACTION DETAILS']);
      worksheet.getCell('A13').font = { bold: true };

      const headers_excel = ['Date', 'Client Name', 'Contact', 'Client Type', 'Transaction Type', 'Reference', 'Invoice/Project', 'Amount', 'Payment Method', 'Status'];
      worksheet.addRow(headers_excel);

      transactions.forEach(t => {
        worksheet.addRow([
          new Date(t.date).toLocaleDateString(),
          t.clientName || 'N/A',
          t.clientContact || 'N/A',
          t.clientType || 'N/A',
          t.transactionType || 'N/A',
          t.reference || 'N/A',
          t.invoiceNumber || t.projectName || 'N/A',
          t.amount || 0,
          t.paymentMethod || 'N/A',
          t.status || 'N/A'
        ]);
      });

      worksheet.columns.forEach(col => { col.width = 18; });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=client-transaction-report-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    res.status(400).json({ message: `Invalid format '${format}'. Use csv, pdf, or xlsx` });

  } catch (error) {
    console.error('[Export ClientTransaction] Error:', error);
    res.status(500).json({ message: 'Failed to export report', error: error.message });
  }
};

// ============ HELPER FUNCTIONS FOR ADMIN ============

// @desc    Get all clients for dropdown
// @route   GET /api/admin/clients
// @access  Private (Admin)
exports.getAllClients = async (req, res) => {
  try {
    console.log('[GetClients] Fetching all clients');

    const clients = await Client.find()
      .select('contactFirstName contactLastName contactNumber client_type');

    console.log(`[GetClients] Found ${clients.length} clients`);

    res.json({ success: true, clients });
  } catch (error) {
    console.error('[GetClients] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error.message
    });
  }
};

// @desc    Get client stats
// @route   GET /api/admin/clients/stats
// @access  Private (Admin)
exports.getClientStats = async (req, res) => {
  try {
    console.log('[GetClientStats] Fetching client statistics');

    const total = await Client.countDocuments();
    const residential = await Client.countDocuments({ client_type: 'Residential' });
    const company = await Client.countDocuments({ client_type: 'Company' });
    const industrial = await Client.countDocuments({ client_type: 'Industrial' });

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await Client.countDocuments({
      createdAt: { $gte: currentMonth }
    });

    console.log(`[GetClientStats] Total: ${total}, New this month: ${newThisMonth}`);

    res.json({
      success: true,
      stats: { total, residential, company, industrial, active: total, new: newThisMonth }
    });
  } catch (error) {
    console.error('[GetClientStats] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client stats',
      error: error.message
    });
  }
};

// @desc    Generate custom report
// @route   POST /api/admin/reports/generate
// @access  Private (Admin)
exports.generateCustomReport = async (req, res) => {
  try {
    console.log('[GenerateCustom] Request body:', req.body);

    const { type, dateRange, filters } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: type. Options: site-assessment, project-summary, financial, client-transaction'
      });
    }

    let reportData = {};

    if (type === 'site-assessment') {
      reportData = await getSiteAssessmentData({
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
        assessmentId: filters?.assessmentId
      });
    } else if (type === 'project-summary') {
      reportData = await getProjectSummaryData({
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
        projectId: filters?.projectId
      });
    } else if (type === 'financial') {
      reportData = await getFinancialData({
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate
      });
    } else if (type === 'client-transaction') {
      reportData = await getClientTransactionData({
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
        clientId: filters?.clientId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Invalid report type '${type}'. Options: site-assessment, project-summary, financial, client-transaction`
      });
    }

    res.json({ success: true, report: reportData });

  } catch (error) {
    console.error('[GenerateCustom] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom report',
      error: error.message
    });
  }
};

// @desc    Export report
// @route   POST /api/admin/reports/export
// @access  Private (Admin)
exports.exportReport = async (req, res) => {
  try {
    console.log('[Export] Request body:', req.body);

    const { format, type, data } = req.body;

    if (!format) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: format. Options: csv, pdf, xlsx'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: type. Options: site-assessment, project-summary, financial, client-transaction'
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: data. Report data is required for export.'
      });
    }

    if (type === 'site-assessment') {
      return exports.exportSiteAssessmentReport(req, res);
    } else if (type === 'project-summary') {
      return exports.exportProjectSummaryReport(req, res);
    } else if (type === 'financial') {
      return exports.exportFinancialReport(req, res);
    } else if (type === 'client-transaction') {
      return exports.exportClientTransactionReport(req, res);
    }

    return res.status(400).json({
      success: false,
      message: `Invalid report type '${type}'. Options: site-assessment, project-summary, financial, client-transaction`
    });

  } catch (error) {
    console.error('[Export] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      error: error.message
    });
  }
};