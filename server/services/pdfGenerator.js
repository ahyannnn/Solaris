// services/pdfGenerator.js
const PDFDocument = require('pdfkit');

class PDFGenerator {
  // Free Quote PDF Generator
  async generateFreeQuotePDF(quoteData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // Header
        doc.fontSize(24)
           .fillColor('#2c3e50')
           .text('SOLARIS ENGINEERING', { align: 'center' });
        doc.fontSize(14)
           .fillColor('#7f8c8d')
           .text('Solar Energy Solutions', { align: 'center' });
        doc.moveDown();
        
        doc.strokeColor('#3498db')
           .lineWidth(2)
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        doc.moveDown();
        
        // Title
        doc.fontSize(20)
           .fillColor('#27ae60')
           .text('SOLAR QUOTATION', { align: 'center' });
        doc.moveDown();
        
        // Quote Reference
        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Quote Reference: ${quoteData.quotationReference}`, { align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.text(`Valid Until: ${quoteData.quotationExpiryDate || new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();
        
        // Client Information
        doc.fontSize(14)
           .fillColor('#2c3e50')
           .text('Client Information', { underline: true });
        doc.fontSize(10)
           .fillColor('#34495e')
           .text(`Name: ${quoteData.clientName}`);
        if (quoteData.clientPhone) doc.text(`Contact: ${quoteData.clientPhone}`);
        if (quoteData.clientEmail) doc.text(`Email: ${quoteData.clientEmail}`);
        doc.text(`Property Type: ${quoteData.propertyType || 'Residential'}`);
        if (quoteData.address) doc.text(`Address: ${quoteData.address}`);
        doc.moveDown();
        
        // System Specifications
        doc.fontSize(14)
           .fillColor('#2c3e50')
           .text('System Specifications', { underline: true });
        doc.fontSize(10)
           .fillColor('#34495e');
        
        const specs = [
          ['System Type:', quoteData.systemTypeLabel || 'Grid-Tie System'],
          ['System Size:', `${quoteData.systemSize} kWp`],
          ['Panels Needed:', quoteData.panelsNeeded?.toString() || 'To be determined'],
          ['Inverter Type:', quoteData.inverterType || 'Standard'],
          ['Battery Type:', quoteData.batteryType || 'N/A (Grid-Tie)'],
          ['Warranty:', `${quoteData.warrantyYears} Years`]
        ];
        
        specs.forEach(([label, value]) => {
          doc.text(`${label} ${value}`);
        });
        doc.moveDown();
        
        // Cost Breakdown
        doc.fontSize(14)
           .fillColor('#2c3e50')
           .text('Cost Breakdown', { underline: true });
        doc.fontSize(10)
           .fillColor('#34495e');
        
        const startY = doc.y;
        doc.text('Equipment Cost:', 50, startY);
        doc.text(`₱ ${quoteData.equipmentCost?.toLocaleString() || 0}`, 400, startY);
        doc.text('Installation Cost:', 50, startY + 20);
        doc.text(`₱ ${quoteData.installationCost?.toLocaleString() || 0}`, 400, startY + 20);
        
        doc.strokeColor('#27ae60')
           .lineWidth(1)
           .moveTo(50, startY + 40)
           .lineTo(550, startY + 40)
           .stroke();
        
        doc.fontSize(12)
           .fillColor('#27ae60')
           .text('Total Cost:', 50, startY + 45);
        doc.text(`₱ ${quoteData.totalCost?.toLocaleString() || 0}`, 400, startY + 45);
        
        doc.moveDown(3);
        
        // Payment Terms
        if (quoteData.paymentTerms) {
          doc.fontSize(12)
             .fillColor('#2c3e50')
             .text('Payment Terms', { underline: true });
          doc.fontSize(10)
             .fillColor('#34495e')
             .text(quoteData.paymentTerms);
          doc.moveDown();
        }
        
        // Remarks
        if (quoteData.remarks) {
          doc.fontSize(12)
             .fillColor('#2c3e50')
             .text('Remarks', { underline: true });
          doc.fontSize(10)
             .fillColor('#34495e')
             .text(quoteData.remarks);
          doc.moveDown();
        }
        
        // Footer
        doc.fontSize(8)
           .fillColor('#95a5a6')
           .text('This is a computer-generated quotation. Please contact us for any inquiries.', 
             { align: 'center', marginTop: 30 });
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Pre-Assessment PDF Generator (with IoT Data)
  async generatePreAssessmentPDF(assessmentData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // Header
        doc.fontSize(24)
           .fillColor('#2c3e50')
           .text('SOLARIS ENGINEERING', { align: 'center' });
        doc.fontSize(14)
           .fillColor('#7f8c8d')
           .text('Pre-Assessment Report & Quotation', { align: 'center' });
        doc.moveDown();
        
        doc.strokeColor('#3498db')
           .lineWidth(2)
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        doc.moveDown();
        
        // Reference
        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Booking Reference: ${assessmentData.bookingReference}`, { align: 'right' });
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.text(`Valid Until: ${assessmentData.quotationExpiryDate || new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();
        
        // Client Information
        doc.fontSize(14)
           .fillColor('#2c3e50')
           .text('Client Information', { underline: true });
        doc.fontSize(10)
           .fillColor('#34495e')
           .text(`Name: ${assessmentData.clientName}`);
        if (assessmentData.clientPhone) doc.text(`Contact: ${assessmentData.clientPhone}`);
        if (assessmentData.clientEmail) doc.text(`Email: ${assessmentData.clientEmail}`);
        doc.text(`Property Type: ${assessmentData.propertyType || 'Residential'}`);
        if (assessmentData.address) doc.text(`Address: ${assessmentData.address}`);
        doc.moveDown();
        
        // IoT Data Analysis Section (if available)
        if (assessmentData.iotAnalysis) {
          doc.fontSize(14)
             .fillColor('#2c3e50')
             .text('IoT Data Analysis (7-Day Monitoring)', { underline: true });
          doc.fontSize(10)
             .fillColor('#34495e');
          
          const iotData = assessmentData.iotAnalysis;
          
          doc.text(`Data Collection Period: ${assessmentData.dataCollectionStart || 'Start'} to ${assessmentData.dataCollectionEnd || 'End'}`);
          doc.text(`Total Readings: ${iotData.totalReadings || 0}`);
          doc.moveDown();
          
          // Irradiance Analysis
          doc.fontSize(12)
             .fillColor('#27ae60')
             .text('Solar Irradiance Analysis:', { underline: true });
          doc.fontSize(10)
             .fillColor('#34495e');
          doc.text(`Average Irradiance: ${iotData.averageIrradiance?.toFixed(0) || 0} W/m²`);
          doc.text(`Peak Irradiance: ${iotData.maxIrradiance?.toFixed(0) || 0} W/m²`);
          doc.text(`Peak Sun Hours: ${iotData.peakSunHours?.toFixed(1) || 0} hours/day`);
          doc.moveDown();
          
          // Temperature Analysis
          doc.fontSize(12)
             .fillColor('#27ae60')
             .text('Temperature Analysis:', { underline: true });
          doc.fontSize(10)
             .fillColor('#34495e');
          doc.text(`Average Temperature: ${iotData.averageTemperature?.toFixed(1) || 0}°C`);
          doc.text(`Temperature Range: ${iotData.minTemperature?.toFixed(1) || 0}°C - ${iotData.maxTemperature?.toFixed(1) || 0}°C`);
          doc.text(`Efficiency Loss Estimate: ${iotData.efficiencyLoss?.toFixed(1) || 0}%`);
          doc.moveDown();
          
          // Humidity Analysis
          doc.fontSize(12)
             .fillColor('#27ae60')
             .text('Humidity Analysis:', { underline: true });
          doc.fontSize(10)
             .fillColor('#34495e');
          doc.text(`Average Humidity: ${iotData.averageHumidity?.toFixed(0) || 0}%`);
          doc.text(`Humidity Range: ${iotData.minHumidity?.toFixed(0) || 0}% - ${iotData.maxHumidity?.toFixed(0) || 0}%`);
          doc.moveDown();
          
          // System Recommendations from IoT Data
          doc.fontSize(12)
             .fillColor('#27ae60')
             .text('System Recommendations (Based on IoT Data):', { underline: true });
          doc.fontSize(10)
             .fillColor('#34495e');
          doc.text(`Recommended System Size: ${assessmentData.finalSystemSize || iotData.recommendedSystemSize || 'To be determined'} kWp`);
          doc.text(`Optimal Panel Orientation: ${iotData.recommendedOrientation || 'South-facing'}`);
          doc.text(`Recommended Tilt Angle: ${iotData.recommendedTiltAngle || 15}°`);
          doc.text(`Shading Detection: ${iotData.shadingPercentage ? `${iotData.shadingPercentage}% shading detected` : 'Minimal shading'}`);
          doc.moveDown();
        }
        
        // Site Assessment Findings
        if (assessmentData.siteAssessment) {
          doc.fontSize(14)
             .fillColor('#2c3e50')
             .text('Site Assessment Findings', { underline: true });
          doc.fontSize(10)
             .fillColor('#34495e');
          
          doc.text(`Roof Condition: ${assessmentData.siteAssessment.roofCondition || 'Not specified'}`);
          doc.text(`Roof Dimensions: ${assessmentData.siteAssessment.roofLength || '?'}m x ${assessmentData.siteAssessment.roofWidth || '?'}m`);
          doc.text(`Structural Integrity: ${assessmentData.siteAssessment.structuralIntegrity || 'Not specified'}`);
          doc.text(`Estimated Installation Time: ${assessmentData.siteAssessment.estimatedInstallationTime || 'To be determined'} days`);
          if (assessmentData.siteAssessment.recommendations) {
            doc.moveDown();
            doc.fontSize(11).text('Engineer Recommendations:', { underline: true });
            doc.fontSize(10).text(assessmentData.siteAssessment.recommendations);
          }
          doc.moveDown();
        }
        
        // Proposed System Specifications
        doc.fontSize(14)
           .fillColor('#2c3e50')
           .text('Proposed System Specifications', { underline: true });
        doc.fontSize(10)
           .fillColor('#34495e');
        
        const specs = [
          ['System Type:', assessmentData.systemTypeLabel || 'Grid-Tie System'],
          ['System Size:', `${assessmentData.systemSize} kWp`],
          ['Panels Needed:', assessmentData.panelsNeeded?.toString() || 'To be determined'],
          ['Inverter Type:', assessmentData.inverterType || 'Standard'],
          ['Battery Type:', assessmentData.batteryType || 'N/A (Grid-Tie)'],
          ['Warranty:', `${assessmentData.warrantyYears} Years`]
        ];
        
        specs.forEach(([label, value]) => {
          doc.text(`${label} ${value}`);
        });
        doc.moveDown();
        
        // Cost Breakdown
        doc.fontSize(14)
           .fillColor('#2c3e50')
           .text('Cost Breakdown', { underline: true });
        doc.fontSize(10)
           .fillColor('#34495e');
        
        const startY = doc.y;
        doc.text('Equipment Cost:', 50, startY);
        doc.text(`₱ ${assessmentData.equipmentCost?.toLocaleString() || 0}`, 400, startY);
        doc.text('Installation Cost:', 50, startY + 20);
        doc.text(`₱ ${assessmentData.installationCost?.toLocaleString() || 0}`, 400, startY + 20);
        
        doc.strokeColor('#27ae60')
           .lineWidth(1)
           .moveTo(50, startY + 40)
           .lineTo(550, startY + 40)
           .stroke();
        
        doc.fontSize(12)
           .fillColor('#27ae60')
           .text('Total Cost:', 50, startY + 45);
        doc.text(`₱ ${assessmentData.totalCost?.toLocaleString() || 0}`, 400, startY + 45);
        
        doc.moveDown(3);
        
        // Performance Estimates
        if (assessmentData.performanceEstimates) {
          doc.fontSize(12)
             .fillColor('#2c3e50')
             .text('Estimated Performance', { underline: true });
          doc.fontSize(10)
             .fillColor('#34495e');
          doc.text(`Estimated Annual Production: ${assessmentData.performanceEstimates.annualProduction?.toLocaleString() || 0} kWh`);
          doc.text(`Estimated Annual Savings: ₱ ${assessmentData.performanceEstimates.annualSavings?.toLocaleString() || 0}`);
          doc.text(`Payback Period: ${assessmentData.performanceEstimates.paybackPeriod || 0} years`);
          doc.text(`CO₂ Offset: ${assessmentData.performanceEstimates.co2Offset?.toLocaleString() || 0} kg/year`);
          doc.moveDown();
        }
        
        // Payment Terms
        if (assessmentData.paymentTerms) {
          doc.fontSize(12)
             .fillColor('#2c3e50')
             .text('Payment Terms', { underline: true });
          doc.fontSize(10)
             .fillColor('#34495e')
             .text(assessmentData.paymentTerms);
          doc.moveDown();
        }
        
        // Footer
        doc.fontSize(8)
           .fillColor('#95a5a6')
           .text('This report is based on 7-day IoT monitoring and on-site assessment.', 
             { align: 'center' });
        doc.text('For inquiries, please contact our engineering team.', 
          { align: 'center' });
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new PDFGenerator();