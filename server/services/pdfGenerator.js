// services/pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
   constructor() {
      // Professional font configuration
      this.fonts = {
         title: 'Helvetica-Bold',
         sectionHeader: 'Helvetica-Bold',
         body: 'Helvetica',
         tableHeader: 'Helvetica-Bold',
         tableBody: 'Helvetica',
         footer: 'Helvetica-Oblique'
      };

      this.fontSizes = {
         title: 16,
         sectionHeader: 11,
         body: 9,
         tableHeader: 9,
         tableBody: 8,
         footer: 7
      };

      // Page dimensions (A4)
      this.pageWidth = 595.28;
      this.pageHeight = 841.89;
      this.margin = 50;
      this.maxY = this.pageHeight - this.margin;
      this.minY = this.margin;

      // Colors
      this.colors = {
         primary: '#1a3a5c',
         secondary: '#2c6e2c',
         text: '#333333',
         headerBg: '#e8f0f8',
         border: '#cccccc'
      };
   }

   // Helper: Format currency
   formatCurrency(amount) {
      return `₱ ${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
   }

   // Helper: Format date
   formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-PH', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
      });
   }

   // Check if we need a new page (returns true if we should add page)
   checkPageLimit(doc, currentY, requiredSpace) {
      const availableSpace = this.maxY - currentY;
      if (availableSpace < requiredSpace) {
         doc.addPage();
         return this.minY;
      }
      return currentY;
   }

   // Draw professional header
   drawHeader(doc, showRightText = true, rightText = null, reference = null, quotationNumber = null, date = null, expiryDate = null) {
      // Left side - Company info
      doc.font(this.fonts.title).fontSize(this.fontSizes.title).fillColor(this.colors.primary);
      doc.text('SOLARIS ENGINEERING', this.margin, this.minY + 10);
      doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor('#4a627a');
      doc.text('Professional Solar Energy Solutions', this.margin, this.minY + 32);
      doc.text('www.solarisengineering.com', this.margin, this.minY + 46);

      // Right side - Document info
      if (showRightText && rightText) {
         doc.font(this.fonts.title)
            .fontSize(14) // smaller to prevent overflow
            .fillColor(this.colors.secondary);

         // Use full safe page width
         doc.text(
            rightText,
            this.margin,
            this.minY + 10,
            {
               width: this.pageWidth - (this.margin * 2),
               align: 'right'
            }
         );

         doc.font(this.fonts.body).fontSize(8).fillColor('#4a627a');
         let yOffset = this.minY + 32;

         if (reference) {
            doc.text(`Reference: ${reference}`, this.pageWidth - this.margin - 150, yOffset, { align: 'right', width: 150 });
            yOffset += 14;
         }
         if (quotationNumber) {
            doc.text(`Quotation: ${quotationNumber}`, this.pageWidth - this.margin - 150, yOffset, { align: 'right', width: 150 });
            yOffset += 14;
         }
         if (date) {
            doc.text(`Date: ${date}`, this.pageWidth - this.margin - 150, yOffset, { align: 'right', width: 150 });
            yOffset += 14;
         }
         if (expiryDate) {
            doc.text(`Valid Until: ${expiryDate}`, this.pageWidth - this.margin - 150, yOffset, { align: 'right', width: 150 });
         }
      }

      return this.minY + 80;
   }

   // Draw footer
   drawFooter(doc, pageNumber, totalPages, customText = null) {
      const footerY = this.maxY - 20;
      doc.font(this.fonts.footer).fontSize(this.fontSizes.footer).fillColor('#888888');

      if (customText) {
         doc.text(customText, this.margin, footerY - 15, { align: 'center', width: this.pageWidth - (this.margin * 2) });
      }

      doc.text(`Page ${pageNumber} of ${totalPages}`, this.margin, footerY, { align: 'center', width: this.pageWidth - (this.margin * 2) });
   }

   // Draw table header with borders
   drawTableHeader(doc, y, columns) {
      const tableX = this.margin;
      const tableWidth = this.pageWidth - (this.margin * 2);

      // Draw header background
      doc.rect(tableX, y - 8, tableWidth, 25).fill(this.colors.headerBg);

      // Draw header text
      doc.font(this.fonts.tableHeader).fontSize(this.fontSizes.tableHeader).fillColor(this.colors.primary);

      let currentX = tableX;
      columns.forEach(col => {
         const align = col.align || 'left';
         doc.text(col.label, currentX + (align === 'right' ? col.width - 5 : 5), y, {
            width: col.width - 10,
            align: align,
            continued: false
         });
         currentX += col.width;
      });

      // Draw header border lines
      doc.strokeColor(this.colors.border).lineWidth(0.5);

      // Top border
      doc.moveTo(tableX, y - 8).lineTo(tableX + tableWidth, y - 8).stroke();
      // Bottom border of header
      doc.moveTo(tableX, y + 17).lineTo(tableX + tableWidth, y + 17).stroke();

      return y + 25;
   }

   // Draw table row with borders
   drawTableRow(doc, y, columns, values, isLastRow = false) {
      const tableX = this.margin;
      const tableWidth = this.pageWidth - (this.margin * 2);

      doc.font(this.fonts.tableBody).fontSize(this.fontSizes.tableBody).fillColor(this.colors.text);

      let currentX = tableX;
      columns.forEach((col, index) => {
         const value = values[index] || '';
         const align = col.align || 'left';
         doc.text(value, currentX + (align === 'right' ? col.width - 5 : 5), y, {
            width: col.width - 10,
            align: align
         });
         currentX += col.width;
      });

      // Draw bottom border
      if (!isLastRow) {
         doc.moveTo(tableX, y + 15).lineTo(tableX + tableWidth, y + 15).stroke();
      }

      return y + 20;
   }

   // Draw section header
   drawSectionHeader(doc, y, title) {
      doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.sectionHeader).fillColor(this.colors.primary);
      doc.text(title, this.margin, y);
      return y + 20;
   }

   // Draw client info section
   drawClientInfo(doc, y, data) {
      y = this.drawSectionHeader(doc, y, 'CLIENT INFORMATION');

      doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
      doc.text(`Name: ${data.clientName || 'N/A'}`, this.margin + 10, y);
      y += 16;

      if (data.clientPhone) {
         doc.text(`Contact: ${data.clientPhone}`, this.margin + 10, y);
         y += 16;
      }

      if (data.clientEmail) {
         doc.text(`Email: ${data.clientEmail}`, this.margin + 10, y);
         y += 16;
      }

      doc.text(`Property: ${data.propertyType || 'Residential'}`, this.margin + 10, y);
      y += 16;

      if (data.address) {
         const addressText = data.address.length > 80 ? data.address.substring(0, 77) + '...' : data.address;
         doc.text(`Address: ${addressText}`, this.margin + 10, y);
         y += 20;
      } else {
         y += 4;
      }

      return y;
   }

   // Draw system specs
   drawSystemSpecs(doc, y, data) {
      y = this.drawSectionHeader(doc, y, 'PROPOSED SYSTEM');

      const specs = [
         ['System Type:', data.systemTypeLabel || 'Grid-Tie System'],
         ['System Capacity:', `${data.systemSize} kWp`],
         ['Solar Panels:', `${data.panelsNeeded} units`],
         ['Panel Model:', (data.panelType || 'Standard').substring(0, 30)],
         ['Inverter:', (data.inverterType || 'Standard').substring(0, 30)],
         ['Battery:', (data.batteryType || 'Not Included').substring(0, 30)],
         ['Warranty:', `${data.warrantyYears} Years`]
      ];

      doc.font(this.fonts.body).fontSize(this.fontSizes.body);

      specs.forEach(([label, value]) => {
         const neededSpace = 20;
         if (y + neededSpace > this.maxY - 50) {
            doc.addPage();
            y = this.minY;
            this.drawHeader(doc, true, 'PRE-ASSESSMENT REPORT', data.bookingReference, data.quotationNumber,
               this.formatDate(new Date()), this.formatDate(data.quotationExpiryDate));
            y = this.drawClientInfo(doc, y, data);
            y = this.drawSectionHeader(doc, y, 'PROPOSED SYSTEM');
         }

         doc.font(this.fonts.sectionHeader).fillColor('#555555').text(label, this.margin + 10, y);
         doc.font(this.fonts.body).fillColor(this.colors.text).text(value, this.margin + 130, y);
         y += 16;
      });

      return y + 15;
   }

   // Draw equipment cost breakdown table
   drawEquipmentTable(doc, y, data) {
      y = this.drawSectionHeader(doc, y, 'EQUIPMENT COST BREAKDOWN');

      // Define columns
      const columns = [
         { label: 'Item', width: 220, align: 'left' },
         { label: 'Qty', width: 50, align: 'center' },
         { label: 'Unit Price', width: 110, align: 'right' },
         { label: 'Total', width: 110, align: 'right' }
      ];

      // Draw table header
      y = this.drawTableHeader(doc, y, columns);

      const cb = data.costBreakdown;
      const rows = [];

      // Collect all equipment items
      if (cb.equipment.panels.quantity > 0) {
         rows.push([
            cb.equipment.panels.name,
            cb.equipment.panels.quantity.toString(),
            this.formatCurrency(cb.equipment.panels.unitPrice),
            this.formatCurrency(cb.equipment.panels.total)
         ]);
      }

      if (cb.equipment.inverter.quantity > 0) {
         rows.push([
            cb.equipment.inverter.name,
            cb.equipment.inverter.quantity.toString(),
            this.formatCurrency(cb.equipment.inverter.unitPrice),
            this.formatCurrency(cb.equipment.inverter.total)
         ]);
      }

      if (cb.equipment.battery.quantity > 0) {
         rows.push([
            cb.equipment.battery.name,
            cb.equipment.battery.quantity.toString(),
            this.formatCurrency(cb.equipment.battery.unitPrice),
            this.formatCurrency(cb.equipment.battery.total)
         ]);
      }

      rows.push([
         cb.equipment.mounting.name,
         cb.equipment.mounting.quantity.toString(),
         this.formatCurrency(cb.equipment.mounting.unitPrice),
         this.formatCurrency(cb.equipment.mounting.total)
      ]);

      rows.push([
         cb.equipment.electrical.name,
         '-',
         '-',
         this.formatCurrency(cb.equipment.electrical.total)
      ]);

      rows.push([
         `${cb.equipment.cables.name} (${cb.equipment.cables.quantity}m)`,
         '-',
         '-',
         this.formatCurrency(cb.equipment.cables.total)
      ]);

      // Draw rows
      for (let i = 0; i < rows.length; i++) {
         const requiredSpace = 25;
         if (y + requiredSpace > this.maxY - 80) {
            doc.addPage();
            y = this.minY;
            this.drawHeader(doc, true, 'PRE-ASSESSMENT REPORT', data.bookingReference, data.quotationNumber,
               this.formatDate(new Date()), this.formatDate(data.quotationExpiryDate));
            y = this.drawSectionHeader(doc, y, 'EQUIPMENT COST BREAKDOWN');
            y = this.drawTableHeader(doc, y, columns);
         }

         y = this.drawTableRow(doc, y, columns, rows[i], i === rows.length - 1);
      }

      // Draw subtotal
      y += 5;
      doc.font(this.fonts.tableHeader).fontSize(this.fontSizes.tableHeader).fillColor(this.colors.primary);
      doc.text('SUBTOTAL (EQUIPMENT)', this.pageWidth - this.margin - 220, y, { width: 110, align: 'right' });
      doc.text(this.formatCurrency(data.calculatedEquipmentTotal), this.pageWidth - this.margin - 110, y, { width: 110, align: 'right' });
      y += 20;

      return y;
   }

   // Draw installation cost section
   drawInstallationCost(doc, y, data) {
      y = this.drawSectionHeader(doc, y, 'INSTALLATION COST');

      const cb = data.costBreakdown;
      const columns = [
         { label: 'Description', width: 380, align: 'left' },
         { label: 'Amount', width: 110, align: 'right' }
      ];

      y = this.drawTableHeader(doc, y, columns);

      const rows = [
         [`Per kW (${cb.installation.perKw.quantity} kW × ${this.formatCurrency(cb.installation.perKw.rate)})`,
         this.formatCurrency(cb.installation.perKw.total)],
         [`Per Panel (${cb.installation.perPanel.quantity} × ${this.formatCurrency(cb.installation.perPanel.rate)})`,
         this.formatCurrency(cb.installation.perPanel.total)]
      ];

      rows.forEach((row, index) => {
         const requiredSpace = 25;
         if (y + requiredSpace > this.maxY - 80) {
            doc.addPage();
            y = this.minY;
            this.drawHeader(doc, true, 'PRE-ASSESSMENT REPORT', data.bookingReference, data.quotationNumber,
               this.formatDate(new Date()), this.formatDate(data.quotationExpiryDate));
            y = this.drawSectionHeader(doc, y, 'INSTALLATION COST');
            y = this.drawTableHeader(doc, y, columns);
         }

         y = this.drawTableRow(doc, y, columns, row, index === rows.length - 1);
      });

      // Draw subtotal
      y += 5;
      doc.font(this.fonts.tableHeader).fontSize(this.fontSizes.tableHeader).fillColor(this.colors.primary);
      doc.text('SUBTOTAL (INSTALLATION)', this.pageWidth - this.margin - 220, y, { width: 110, align: 'right' });
      doc.text(this.formatCurrency(data.calculatedInstallationTotal), this.pageWidth - this.margin - 110, y, { width: 110, align: 'right' });
      y += 25;

      // Draw grand total
      doc.font(this.fonts.title).fontSize(12).fillColor(this.colors.secondary);
      doc.text('TOTAL PROJECT INVESTMENT', this.margin, y);
      doc.text(this.formatCurrency(data.calculatedTotalCost), this.pageWidth - this.margin - 110, y, { width: 110, align: 'right' });
      y += 30;

      return y;
   }

   // Draw page 1 content
   async drawPage1(doc, data) {
      let y = this.drawHeader(doc, true, 'PRE-ASSESSMENT REPORT', data.bookingReference,
         data.quotationNumber, this.formatDate(new Date()),
         this.formatDate(data.quotationExpiryDate));

      y = this.drawClientInfo(doc, y, data);
      y = this.drawSystemSpecs(doc, y, data);
      y = this.drawEquipmentTable(doc, y, data);
      y = this.drawInstallationCost(doc, y, data);

      // Payment terms if space allows
      if (data.paymentTerms && y + 60 < this.maxY) {
         y = this.drawSectionHeader(doc, y, 'PAYMENT TERMS');
         doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
         const termsShort = data.paymentTerms.length > 200 ? data.paymentTerms.substring(0, 197) + '...' : data.paymentTerms;
         doc.text(termsShort, this.margin + 10, y, { width: this.pageWidth - (this.margin * 2) - 10 });
      }

      this.drawFooter(doc, 1, 2);
   }

   // Draw page 2 content
   async drawPage2(doc, data) {
      let y = this.drawHeader(doc, true, 'SITE FINDINGS & ANALYSIS', data.bookingReference,
         data.quotationNumber, null, null);

      // 7-Day Monitoring Results
      if (data.iotAnalysis) {
         y = this.drawSectionHeader(doc, y, '7-DAY MONITORING RESULTS');

         const iot = data.iotAnalysis;
         const leftColX = this.margin + 10;
         const rightColX = this.margin + 300;

         // Left column
         doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.body).fillColor(this.colors.secondary);
         doc.text('Solar Irradiance', leftColX, y);
         y += 16;
         doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
         doc.text(`Average: ${iot.averageIrradiance?.toFixed(0) || 0} W/m²`, leftColX + 10, y);
         y += 14;
         doc.text(`Peak: ${iot.maxIrradiance?.toFixed(0) || 0} W/m²`, leftColX + 10, y);
         y += 14;
         doc.text(`Sun Hours: ${iot.peakSunHours?.toFixed(1) || 0} hrs/day`, leftColX + 10, y);
         y += 20;

         doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.body).fillColor(this.colors.secondary);
         doc.text('Temperature', leftColX, y);
         y += 16;
         doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
         doc.text(`Average: ${iot.averageTemperature?.toFixed(1) || 0}°C`, leftColX + 10, y);
         y += 14;
         doc.text(`Range: ${iot.minTemperature?.toFixed(1) || 0}°C to ${iot.maxTemperature?.toFixed(1) || 0}°C`, leftColX + 10, y);
         y += 14;
         doc.text(`Efficiency Loss: ${iot.efficiencyLoss?.toFixed(1) || 0}%`, leftColX + 10, y);
         y += 20;

         doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.body).fillColor(this.colors.secondary);
         doc.text('Humidity', leftColX, y);
         y += 16;
         doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
         doc.text(`Average: ${iot.averageHumidity?.toFixed(0) || 0}%`, leftColX + 10, y);
         y += 14;
         doc.text(`Range: ${iot.minHumidity?.toFixed(0) || 0}% to ${iot.maxHumidity?.toFixed(0) || 0}%`, leftColX + 10, y);
         y += 20;

         // Right column
         let rightY = y - 120; // Align with left column start
         doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.body).fillColor(this.colors.secondary);
         doc.text('System Recommendation', rightColX, rightY);
         rightY += 16;
         doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
         doc.text(`System Size: ${iot.recommendedSystemSize || data.systemSize} kWp`, rightColX + 10, rightY);
         rightY += 14;
         doc.text(`Peak Sun Hours: ${iot.peakSunHours?.toFixed(1) || 0} hrs/day`, rightColX + 10, rightY);
         rightY += 14;
         doc.text(`Efficiency Loss: ${iot.efficiencyLoss?.toFixed(1) || 0}%`, rightColX + 10, rightY);
         rightY += 30;

         y = Math.max(y, rightY);
         y += 15;
      }

      // Site Assessment
      if (data.siteAssessment) {
         const requiredSpace = 120;
         if (y + requiredSpace > this.maxY - 60) {
            doc.addPage();
            y = this.minY;
            this.drawHeader(doc, true, 'SITE FINDINGS & ANALYSIS', data.bookingReference,
               data.quotationNumber, null, null);
         }

         y = this.drawSectionHeader(doc, y, 'SITE ASSESSMENT');

         const sa = data.siteAssessment;
         doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);

         if (sa.roofCondition) {
            doc.text(`Roof Condition: ${sa.roofCondition}`, this.margin + 10, y);
            y += 16;
         }

         if (sa.roofLength && sa.roofWidth) {
            doc.text(`Roof Dimensions: ${sa.roofLength}m × ${sa.roofWidth}m (${(sa.roofLength * sa.roofWidth).toFixed(1)}m²)`,
               this.margin + 10, y);
            y += 16;
         }

         if (sa.structuralIntegrity) {
            doc.text(`Structural Integrity: ${sa.structuralIntegrity}`, this.margin + 10, y);
            y += 16;
         }

         if (sa.estimatedInstallationTime) {
            doc.text(`Installation Time: ${sa.estimatedInstallationTime} days`, this.margin + 10, y);
            y += 20;
         }

         if (sa.recommendations) {
            y = this.drawSectionHeader(doc, y, 'Engineer Recommendations');
            const recShort = sa.recommendations.length > 200 ? sa.recommendations.substring(0, 197) + '...' : sa.recommendations;
            doc.text(recShort, this.margin + 10, y, { width: this.pageWidth - (this.margin * 2) - 10 });
            y += 30;
         }
      }

      // Performance Estimates
      if (data.performanceEstimates) {
         const requiredSpace = 100;
         if (y + requiredSpace > this.maxY - 60) {
            doc.addPage();
            y = this.minY;
            this.drawHeader(doc, true, 'SITE FINDINGS & ANALYSIS', data.bookingReference,
               data.quotationNumber, null, null);
            y = this.drawSectionHeader(doc, y, 'ESTIMATED PERFORMANCE');
         } else {
            y = this.drawSectionHeader(doc, y, 'ESTIMATED PERFORMANCE');
         }

         const pe = data.performanceEstimates;
         doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
         doc.text(`Annual Production: ${pe.annualProduction?.toLocaleString() || 0} kWh`, this.margin + 10, y);
         y += 16;
         doc.text(`Annual Savings: ${this.formatCurrency(pe.annualSavings)}`, this.margin + 10, y);
         y += 16;
         doc.text(`Payback Period: ${pe.paybackPeriod || 0} years`, this.margin + 10, y);
         y += 16;
         doc.text(`CO₂ Reduction: ${pe.co2Offset?.toLocaleString() || 0} kg/year`, this.margin + 10, y);
      }

      this.drawFooter(doc, 2, 2, 'This report is based on on-site assessment and 7-day IoT monitoring data.');
   }

   // Main PDF generation methods
   async generateFreeQuotePDF(quoteData) {
      return new Promise((resolve, reject) => {
         try {
            const doc = new PDFDocument({ margin: this.margin, size: 'A4' });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Use professional fonts
            doc.font(this.fonts.body);

            // Header
            doc.font(this.fonts.title).fontSize(18).fillColor(this.colors.primary);
            doc.text('SOLARIS ENGINEERING', this.margin, this.minY + 10);
            doc.font(this.fonts.body).fontSize(9).fillColor('#4a627a');
            doc.text('Professional Solar Energy Solutions', this.margin, this.minY + 32);
            doc.text('www.solarisengineering.com', this.margin, this.minY + 46);

            // Document Title
            doc.font(this.fonts.title).fontSize(14).fillColor(this.colors.secondary);
            doc.text('SOLAR QUOTATION', this.pageWidth - this.margin - 150, this.minY + 10, { align: 'right', width: 150 });
            doc.font(this.fonts.body).fontSize(8).fillColor('#4a627a');
            doc.text(`Reference: ${quoteData.quotationReference}`, this.pageWidth - this.margin - 150, this.minY + 32, { align: 'right', width: 150 });
            doc.text(`Date: ${this.formatDate(new Date())}`, this.pageWidth - this.margin - 150, this.minY + 46, { align: 'right', width: 150 });
            doc.text(`Valid Until: ${this.formatDate(quoteData.quotationExpiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}`,
               this.pageWidth - this.margin - 150, this.minY + 60, { align: 'right', width: 150 });

            let yPos = this.minY + 100;

            // Client Information
            yPos = this.drawSectionHeader(doc, yPos, 'CLIENT INFORMATION');
            doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
            doc.text(`Name: ${quoteData.clientName}`, this.margin + 10, yPos);
            yPos += 16;
            if (quoteData.clientPhone) doc.text(`Contact: ${quoteData.clientPhone}`, this.margin + 10, yPos);
            yPos += 16;
            if (quoteData.clientEmail) doc.text(`Email: ${quoteData.clientEmail}`, this.margin + 10, yPos);
            yPos += 16;
            doc.text(`Property: ${quoteData.propertyType || 'Residential'}`, this.margin + 10, yPos);
            yPos += 16;
            if (quoteData.address) doc.text(`Address: ${quoteData.address.substring(0, 80)}`, this.margin + 10, yPos);
            yPos += 25;

            // System Specifications
            yPos = this.drawSectionHeader(doc, yPos, 'SYSTEM SPECIFICATIONS');

            const specs = [
               ['System Type:', quoteData.systemTypeLabel || 'Grid-Tie System'],
               ['System Capacity:', `${quoteData.systemSize} kWp`],
               ['Panels:', quoteData.panelsNeeded?.toString() || 'TBD'],
               ['Inverter:', quoteData.inverterType || 'Standard'],
               ['Battery:', quoteData.batteryType || 'Not Included'],
               ['Warranty:', `${quoteData.warrantyYears} Years`]
            ];

            specs.forEach(([label, value]) => {
               doc.font(this.fonts.sectionHeader).fontSize(8).fillColor('#555555').text(label, this.margin + 10, yPos);
               doc.font(this.fonts.body).fillColor(this.colors.text).text(value, this.margin + 100, yPos);
               yPos += 16;
            });

            yPos += 15;

            // Cost Breakdown Table
            yPos = this.drawSectionHeader(doc, yPos, 'COST BREAKDOWN');

            const quoteColumns = [
               { label: 'Description', width: 380, align: 'left' },
               { label: 'Amount', width: 110, align: 'right' }
            ];

            yPos = this.drawTableHeader(doc, yPos, quoteColumns);

            const quoteRows = [
               ['Equipment Cost', this.formatCurrency(quoteData.equipmentCost)],
               ['Installation & Labor', this.formatCurrency(quoteData.installationCost)]
            ];

            quoteRows.forEach((row, index) => {
               yPos = this.drawTableRow(doc, yPos, quoteColumns, row, index === quoteRows.length - 1);
            });

            yPos += 10;
            doc.font(this.fonts.title).fontSize(11).fillColor(this.colors.secondary);
            doc.text('TOTAL INVESTMENT', this.margin, yPos);
            doc.text(this.formatCurrency(quoteData.totalCost), this.pageWidth - this.margin - 110, yPos, { width: 110, align: 'right' });

            // Footer
            this.drawFooter(doc, 1, 1, 'This is a computer-generated quotation. Terms and conditions apply.');

            doc.end();
         } catch (error) {
            reject(error);
         }
      });
   }

   // Pre-Assessment PDF Generator (EXACTLY 2 Pages)
   async generatePreAssessmentPDF(assessmentData) {
      return new Promise((resolve, reject) => {
         try {
            const doc = new PDFDocument({
               margin: this.margin,
               size: 'A4',
               autoFirstPage: true
            });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Use professional fonts
            doc.font(this.fonts.body);

            // Force exactly 2 pages - Page 1
            this.drawPage1(doc, assessmentData).then(() => {
               // Force Page 2
               doc.addPage();

               // Draw Page 2
               this.drawPage2(doc, assessmentData).then(() => {
                  doc.end();
               }).catch(reject);
            }).catch(reject);

         } catch (error) {
            reject(error);
         }
      });
   }
}

module.exports = new PDFGenerator();