const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
   constructor() {
      // Professional font configuration - ADD Roboto for currency
      this.fonts = {
         title: 'Helvetica-Bold',
         sectionHeader: 'Helvetica-Bold',
         body: 'Helvetica',
         tableHeader: 'Helvetica-Bold',
         tableBody: 'Helvetica',
         footer: 'Helvetica-Oblique',
         currency: 'Roboto-Regular'  // ✅ ADD Roboto for ₱ symbol support
      };

      this.fontSizes = {
         title: 16,
         sectionHeader: 11,
         body: 9,
         tableHeader: 9,
         tableBody: 8,
         footer: 7,
         currency: 9  // ✅ Add currency font size
      };

      // Page dimensions (A4)
      this.pageWidth = 595.28;
      this.pageHeight = 841.89;
      this.margin = 50;
      this.maxY = this.pageHeight - this.margin;
      this.minY = this.margin;

      // Colors - All text black, table header #92D050, total #FFFF00
      this.colors = {
         primary: '#000000',      // Changed to black
         secondary: '#000000',    // Changed to black
         text: '#000000',         // Changed to black
         headerBg: '#92D050',     // Table header background color
         border: '#000000',       // Border color black
         total: '#000000'         // Total color
      };

      // ✅ Flag to track if Roboto font is available
      this.robotoAvailable = false;
   }

   // ✅ Register Roboto font (call this when creating a new PDF document)
   registerRobotoFont(doc) {
      try {
         const fontsPath = path.join(__dirname, '../fonts');
         const robotoPath = path.join(fontsPath, 'Roboto-Regular.ttf');

         if (fs.existsSync(robotoPath)) {
            doc.registerFont('Roboto-Regular', robotoPath);
            this.robotoAvailable = true;
            console.log('✓ Roboto font registered for ₱ symbol');
         } else {
            // Fallback to Helvetica if Roboto not found
            this.fonts.currency = 'Helvetica';
            this.robotoAvailable = false;
            console.log('⚠ Roboto not found, using Helvetica for ₱ symbol');
         }
      } catch (e) {
         this.fonts.currency = 'Helvetica';
         this.robotoAvailable = false;
         console.log('⚠ Roboto registration failed, using Helvetica for ₱ symbol');
      }
   }

   // Helper: Format currency - UPDATED to use Roboto-friendly string
   formatCurrency(amount) {
      if (amount === null || amount === undefined) return '₱ 0.00';
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      const validAmount = isNaN(numAmount) ? 0 : numAmount;
      // Return as string with ₱ symbol - font will be applied during rendering
      return `₱ ${validAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
   }

   // ✅ Helper: Render currency text with Roboto font and total color
   renderCurrency(doc, text, x, y, options = {}) {
      const defaultOptions = {
         width: 100,
         align: 'right',
         size: this.fontSizes.currency
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Use Roboto font for currency (supports ₱)
      doc.font(this.fonts.currency).fontSize(mergedOptions.size);

      // Check if this is a total value (contains "TOTAL" or is the grand total)
      // Use yellow color (#FFFF00) for totals
      doc.fillColor(this.colors.total);
      doc.text(text, x, y, {
         width: mergedOptions.width,
         align: mergedOptions.align,
         continued: false
      });

      // Reset to default font for subsequent text
      doc.font(this.fonts.body);
      doc.fillColor(this.colors.text);
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

   // Check if we need a new page
   checkPageLimit(doc, currentY, requiredSpace) {
      const availableSpace = this.maxY - currentY;
      if (availableSpace < requiredSpace) {
         doc.addPage();
         return this.minY;
      }
      return currentY;
   }

   // Draw professional header - UPDATED with black text
   drawHeader(doc, showRightText = true, rightText = null, reference = null, quotationNumber = null, date = null, expiryDate = null) {
      // Left side - Company info - Black text
      doc.font(this.fonts.title).fontSize(this.fontSizes.title).fillColor('#000000');
      doc.text('SALFER ENGINEERING', this.margin, this.minY + 10);
      doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor('#000000');
      doc.text('Professional Solar Energy Solutions', this.margin, this.minY + 32);
      doc.text('www.solarisengineering.com', this.margin, this.minY + 46);

      // Right side - Document info - Black text
      if (showRightText && rightText) {
         doc.font(this.fonts.title)
            .fontSize(14)
            .fillColor('#000000');

         doc.text(
            rightText,
            this.margin,
            this.minY + 10,
            {
               width: this.pageWidth - (this.margin * 2),
               align: 'right'
            }
         );

         doc.font(this.fonts.body).fontSize(8).fillColor('#000000');
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

   // Draw footer - black text
   drawFooter(doc, pageNumber, totalPages, customText = null) {
      const footerY = this.maxY - 20;
      doc.font(this.fonts.footer).fontSize(this.fontSizes.footer).fillColor('#000000');

      if (customText) {
         doc.text(customText, this.margin, footerY - 15, { align: 'center', width: this.pageWidth - (this.margin * 2) });
      }

      doc.text(`Page ${pageNumber} of ${totalPages}`, this.margin, footerY, { align: 'center', width: this.pageWidth - (this.margin * 2) });
   }

   // Draw table header with borders - UPDATED with #92D050 background and black text
   drawTableHeader(doc, y, columns) {
      const tableX = this.margin;
      const tableWidth = this.pageWidth - (this.margin * 2);

      // Draw header background - #92D050
      doc.rect(tableX, y - 8, tableWidth, 22).fill(this.colors.headerBg);

      // Draw header text - Black
      doc.font(this.fonts.tableHeader).fontSize(this.fontSizes.tableHeader).fillColor('#000000');

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

      // Draw header border lines - Black
      doc.strokeColor('#000000').lineWidth(0.5);

      // Top border
      doc.moveTo(tableX, y - 8).lineTo(tableX + tableWidth, y - 8).stroke();
      // Bottom border of header
      doc.moveTo(tableX, y + 14).lineTo(tableX + tableWidth, y + 14).stroke();

      return y + 22;
   }

   // Draw table row with borders - UPDATED with black text
   drawTableRow(doc, y, columns, values, isLastRow = false) {
      const tableX = this.margin;
      const tableWidth = this.pageWidth - (this.margin * 2);

      let currentX = tableX;
      columns.forEach((col, index) => {
         let value = values[index] || '';
         // Clean the value - remove any special characters
         value = String(value).replace(/[±+=]/g, '').trim();
         const align = col.align || 'left';

         // Check if this is an amount column (contains ₱)
         const isAmountColumn = value.includes('₱') || col.label === 'Amount' || col.label === 'Total' || col.label === 'Unit Price';

         // Black text for all table content
         doc.fillColor('#000000');

         if (isAmountColumn) {
            // Use Roboto font for currency values
            doc.font(this.fonts.currency).fontSize(this.fontSizes.currency);
            doc.text(value, currentX + (align === 'right' ? col.width - 5 : 5), y, {
               width: col.width - 10,
               align: align
            });
            // Reset to body font
            doc.font(this.fonts.tableBody);
         } else {
            doc.font(this.fonts.tableBody).fontSize(this.fontSizes.tableBody);
            doc.text(value, currentX + (align === 'right' ? col.width - 5 : 5), y, {
               width: col.width - 10,
               align: align
            });
         }
         currentX += col.width;
      });

      // Draw bottom border - Black
      if (!isLastRow) {
         doc.moveTo(tableX, y + 16).lineTo(tableX + tableWidth, y + 16).stroke();
      }

      return y + 18;
   }

   // Draw section header - black text
   drawSectionHeader(doc, y, title) {
      doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.sectionHeader).fillColor('#000000');
      doc.text(title, this.margin, y);
      return y + 18;
   }

   // Draw client info section - black text
   drawClientInfo(doc, y, data) {
      y = this.drawSectionHeader(doc, y, 'CLIENT INFORMATION');

      doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor('#000000');
      doc.text(`Name: ${data.clientName || 'N/A'}`, this.margin + 10, y);
      y += 14;

      if (data.clientPhone) {
         doc.text(`Contact: ${data.clientPhone}`, this.margin + 10, y);
         y += 14;
      }

      if (data.clientEmail) {
         doc.text(`Email: ${data.clientEmail}`, this.margin + 10, y);
         y += 14;
      }

      doc.text(`Property: ${data.propertyType || 'Residential'}`, this.margin + 10, y);
      y += 14;

      if (data.address) {
         const addressText = data.address.length > 80 ? data.address.substring(0, 77) + '...' : data.address;
         doc.text(`Address: ${addressText}`, this.margin + 10, y);
         y += 18;
      } else {
         y += 4;
      }

      return y;
   }

   // Draw system specs - UPDATED for black text
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

         doc.font(this.fonts.sectionHeader).fillColor('#000000').text(label, this.margin + 10, y);
         doc.font(this.fonts.body).fillColor('#000000').text(value, this.margin + 130, y);
         y += 14;
      });

      return y + 10;
   }

   // Draw equipment cost breakdown table - UPDATED to use black text
   drawEquipmentTable(doc, y, data) {
      y = this.drawSectionHeader(doc, y, 'SOLAR PV PROPOSAL');

      const columns = [
         { label: 'Equipment Type', width: 90, align: 'left' },
         { label: 'Item', width: 140, align: 'left' },
         { label: 'Qty', width: 35, align: 'center' },
         { label: 'Unit Price', width: 65, align: 'right' },
         { label: 'Total', width: 90, align: 'right' }
      ];

      y = this.drawTableHeader(doc, y, columns);

      const cb = data.costBreakdown;
      const rows = [];

      // Collect ALL equipment items (same as before)
      if (cb.equipment.panels.quantity > 0) {
         rows.push([
            'Solar Panels',
            cb.equipment.panels.name,
            cb.equipment.panels.quantity.toString(),
            this.formatCurrency(cb.equipment.panels.unitPrice),
            this.formatCurrency(cb.equipment.panels.total)
         ]);
      }

      if (cb.equipment.inverter.quantity > 0) {
         rows.push([
            'Inverter',
            cb.equipment.inverter.name,
            cb.equipment.inverter.quantity.toString(),
            this.formatCurrency(cb.equipment.inverter.unitPrice),
            this.formatCurrency(cb.equipment.inverter.total)
         ]);
      }

      if (cb.equipment.battery.quantity > 0) {
         rows.push([
            'Battery',
            cb.equipment.battery.name,
            cb.equipment.battery.quantity.toString(),
            this.formatCurrency(cb.equipment.battery.unitPrice),
            this.formatCurrency(cb.equipment.battery.total)
         ]);
      }

      if (cb.equipment.mountingStructure && cb.equipment.mountingStructure.quantity > 0) {
         rows.push([
            'Mounting Structure',
            cb.equipment.mountingStructure.name || 'Mounting Structure',
            cb.equipment.mountingStructure.quantity.toString(),
            this.formatCurrency(cb.equipment.mountingStructure.unitPrice),
            this.formatCurrency(cb.equipment.mountingStructure.total)
         ]);
      }

      // Electrical Components
      if (cb.equipment.electricalComponents && cb.equipment.electricalComponents.items) {
         cb.equipment.electricalComponents.items.forEach(item => {
            if (item.quantity > 0) {
               rows.push([
                  'Electrical',
                  item.name,
                  item.quantity.toString(),
                  this.formatCurrency(item.price),
                  this.formatCurrency(item.total)
               ]);
            }
         });
      }

      // Cables
      if (cb.equipment.cables && cb.equipment.cables.items) {
         cb.equipment.cables.items.forEach(item => {
            if (item.quantity > 0) {
               const lengthText = item.length ? ` (${item.length}m)` : '';
               rows.push([
                  'Cables',
                  `${item.name}${lengthText}`,
                  item.quantity.toString(),
                  this.formatCurrency(item.price),
                  this.formatCurrency(item.total)
               ]);
            }
         });
      }

      // Junction Boxes
      if (cb.equipment.junctionBoxes && cb.equipment.junctionBoxes.items) {
         cb.equipment.junctionBoxes.items.forEach(item => {
            if (item.quantity > 0) {
               rows.push([
                  'Junction Box',
                  item.name,
                  item.quantity.toString(),
                  this.formatCurrency(item.price),
                  this.formatCurrency(item.total)
               ]);
            }
         });
      }

      // Disconnect Switches
      if (cb.equipment.disconnectSwitches && cb.equipment.disconnectSwitches.items) {
         cb.equipment.disconnectSwitches.items.forEach(item => {
            if (item.quantity > 0) {
               rows.push([
                  'Disconnect Switch',
                  item.name,
                  item.quantity.toString(),
                  this.formatCurrency(item.price),
                  this.formatCurrency(item.total)
               ]);
            }
         });
      }

      // Meters
      if (cb.equipment.meters && cb.equipment.meters.items) {
         cb.equipment.meters.items.forEach(item => {
            if (item.quantity > 0) {
               rows.push([
                  'Meter',
                  item.name,
                  item.quantity.toString(),
                  this.formatCurrency(item.price),
                  this.formatCurrency(item.total)
               ]);
            }
         });
      }

      // Additional Equipment
      if (cb.equipment.additional && cb.equipment.additional.length > 0) {
         cb.equipment.additional.forEach(item => {
            if (item.quantity > 0) {
               rows.push([
                  'Additional',
                  item.name,
                  item.quantity.toString(),
                  this.formatCurrency(item.price),
                  this.formatCurrency(item.total)
               ]);
            }
         });
      }

      // Draw rows
      for (let i = 0; i < rows.length; i++) {
         const requiredSpace = 22;
         if (y + requiredSpace > this.maxY - 80) {
            doc.addPage();
            y = this.minY;
            this.drawHeader(doc, true, 'PRE-ASSESSMENT REPORT', data.bookingReference, data.quotationNumber,
               this.formatDate(new Date()), this.formatDate(data.quotationExpiryDate));
            y = this.drawSectionHeader(doc, y, 'SOLAR PV PROPOSAL');
            y = this.drawTableHeader(doc, y, columns);
         }

         y = this.drawTableRow(doc, y, columns, rows[i], i === rows.length - 1);
      }

      // Draw subtotal - Black text with regular fill, total in yellow
      y += 5;
      doc.font(this.fonts.tableHeader).fontSize(this.fontSizes.tableHeader).fillColor('#000000');
      doc.text('SUBTOTAL (EQUIPMENT)', this.pageWidth - this.margin - 220, y, { width: 110, align: 'right' });
      // Use renderCurrency which applies yellow color
      doc.font(this.fonts.currency).fontSize(this.fontSizes.currency).fillColor(this.colors.total);
      doc.text(this.formatCurrency(data.calculatedEquipmentTotal), this.pageWidth - this.margin - 110, y, { width: 110, align: 'right' });
      doc.fillColor('#000000'); // Reset to black
      doc.font(this.fonts.body);
      y += 18;

      return y;
   }

   // Draw installation cost section - UPDATED with black text, total in yellow
   drawInstallationCost(doc, y, data) {
      y = this.drawSectionHeader(doc, y, 'INSTALLATION COST');

      const columns = [
         { label: 'Description', width: 300, align: 'left' },
         { label: 'Amount', width: 100, align: 'right' }
      ];

      y = this.drawTableHeader(doc, y, columns);

      const cb = data.costBreakdown;
      const rows = [
         [`Installation Labor (${cb.installation.percentage || 20}% of Equipment Cost)`, this.formatCurrency(cb.installation.total)]
      ];

      rows.forEach((row, index) => {
         const requiredSpace = 22;
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

      // Draw subtotal - Black text with regular fill
      y += 5;
      doc.font(this.fonts.tableHeader).fontSize(this.fontSizes.tableHeader).fillColor('#000000');
   
      doc.font(this.fonts.currency).fontSize(this.fontSizes.currency).fillColor(this.colors.total)
      doc.fillColor('#000000');
      y += 18;

      // Draw grand total - Yellow color for total
      doc.font(this.fonts.title).fontSize(12).fillColor('#000000');
      doc.text('TOTAL PACKAGE PRICE (Indirect cost included)', this.margin, y);
      doc.font(this.fonts.currency).fontSize(12).fillColor(this.colors.total);
      doc.text(this.formatCurrency(data.calculatedTotalCost), this.pageWidth - this.margin - 110, y, { width: 110, align: 'right' });
      doc.fillColor('#000000');
      y += 25;

      return y;
   }

   // ============ FREE QUOTE PDF ============
   async generateFreeQuotePDF(quoteData) {
      return new Promise((resolve, reject) => {
         try {
            const doc = new PDFDocument({ margin: this.margin, size: 'A4' });
            const chunks = [];

            // ✅ Register Roboto font at the beginning
            this.registerRobotoFont(doc);

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Draw Free Quote Header
            let y = this.drawHeader(doc, true, 'SOLAR QUOTATION', quoteData.quotationReference,
               quoteData.quotationNumber, this.formatDate(new Date()),
               this.formatDate(quoteData.quotationExpiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));

            // Client Information - Black text
            y = this.drawSectionHeader(doc, y, 'CLIENT INFORMATION');
            doc.font(this.fonts.body).fontSize(8).fillColor('#000000');
            doc.text(`Name: ${quoteData.clientName}`, this.margin + 10, y);
            y += 14;
            if (quoteData.clientPhone) doc.text(`Contact: ${quoteData.clientPhone}`, this.margin + 10, y);
            y += 14;
            if (quoteData.clientEmail) doc.text(`Email: ${quoteData.clientEmail}`, this.margin + 10, y);
            y += 14;
            doc.text(`Property: ${quoteData.propertyType || 'Residential'}`, this.margin + 10, y);
            y += 14;
            if (quoteData.address) doc.text(`Address: ${quoteData.address.substring(0, 80)}`, this.margin + 10, y);
            y += 18;

            // System Specifications - Black text
            y = this.drawSectionHeader(doc, y, 'SYSTEM SPECIFICATIONS');

            const specs = [
               ['System Type:', quoteData.systemTypeLabel || 'Grid-Tie System'],
               ['System Capacity:', `${quoteData.systemSize} kWp`],
               ['Solar Panels:', `${quoteData.panelsNeeded || 0} units`],
               ['Panel Model:', (quoteData.panelType || 'Standard').substring(0, 35)],
               ['Inverter:', (quoteData.inverterType || 'Standard').substring(0, 35)],
               ['Battery:', (quoteData.batteryType || 'Not Included').substring(0, 35)],
               ['Warranty:', `${quoteData.warrantyYears || 10} Years`]
            ];

            specs.forEach(([label, value]) => {
               doc.font(this.fonts.sectionHeader).fontSize(7).fillColor('#000000').text(label, this.margin + 10, y);
               doc.font(this.fonts.body).fillColor('#000000').text(value, this.margin + 110, y, { width: 200 });
               y += 14;
            });

            y += 10;

            // Equipment Cost Breakdown Table
            y = this.drawSectionHeader(doc, y, 'SOLAR PV PROPOSAL');

            const columns = [
               { label: 'Type', width: 50, align: 'left' },
               { label: 'Item', width: 160, align: 'left' },
               { label: 'Qty', width: 35, align: 'center' },
               { label: 'Unit Price', width: 90, align: 'right' },
               { label: 'Total', width: 90, align: 'right' }
            ];

            y = this.drawTableHeader(doc, y, columns);

            const cb = quoteData.costBreakdown;
            const rows = [];

            // Collect all equipment items (same as before)
            if (cb?.equipment?.panels && cb.equipment.panels.quantity > 0) {
               rows.push([
                  'Panels',
                  cb.equipment.panels.name || 'Solar Panels',
                  cb.equipment.panels.quantity.toString(),
                  this.formatCurrency(cb.equipment.panels.unitPrice),
                  this.formatCurrency(cb.equipment.panels.total)
               ]);
            }

            if (cb?.equipment?.inverter && cb.equipment.inverter.quantity > 0) {
               rows.push([
                  'Inv',
                  cb.equipment.inverter.name || 'Inverter',
                  cb.equipment.inverter.quantity.toString(),
                  this.formatCurrency(cb.equipment.inverter.unitPrice),
                  this.formatCurrency(cb.equipment.inverter.total)
               ]);
            }

            if (cb?.equipment?.battery && cb.equipment.battery.quantity > 0) {
               rows.push([
                  'Batt',
                  cb.equipment.battery.name || 'Battery',
                  cb.equipment.battery.quantity.toString(),
                  this.formatCurrency(cb.equipment.battery.unitPrice),
                  this.formatCurrency(cb.equipment.battery.total)
               ]);
            }

            if (cb?.equipment?.mountingStructure && cb.equipment.mountingStructure.quantity > 0) {
               rows.push([
                  'Mount',
                  cb.equipment.mountingStructure.name || 'Mounting',
                  cb.equipment.mountingStructure.quantity.toString(),
                  this.formatCurrency(cb.equipment.mountingStructure.unitPrice),
                  this.formatCurrency(cb.equipment.mountingStructure.total)
               ]);
            }

            // Electrical Components
            if (cb?.equipment?.electricalComponents?.items && cb.equipment.electricalComponents.items.length > 0) {
               cb.equipment.electricalComponents.items.forEach(item => {
                  if (item.quantity > 0) {
                     rows.push([
                        'Elec',
                        item.name.substring(0, 25),
                        item.quantity.toString(),
                        this.formatCurrency(item.price),
                        this.formatCurrency(item.total)
                     ]);
                  }
               });
            }

            // Cables
            if (cb?.equipment?.cables?.items && cb.equipment.cables.items.length > 0) {
               cb.equipment.cables.items.forEach(item => {
                  if (item.quantity > 0) {
                     const displayName = item.length ? `${item.name.substring(0, 20)} (${item.length}m)` : item.name.substring(0, 25);
                     rows.push([
                        'Cable',
                        displayName,
                        item.quantity.toString(),
                        this.formatCurrency(item.price),
                        this.formatCurrency(item.total)
                     ]);
                  }
               });
            }

            // Junction Boxes
            if (cb?.equipment?.junctionBoxes?.items && cb.equipment.junctionBoxes.items.length > 0) {
               cb.equipment.junctionBoxes.items.forEach(item => {
                  if (item.quantity > 0) {
                     rows.push([
                        'J-Box',
                        item.name.substring(0, 25),
                        item.quantity.toString(),
                        this.formatCurrency(item.price),
                        this.formatCurrency(item.total)
                     ]);
                  }
               });
            }

            // Disconnect Switches
            if (cb?.equipment?.disconnectSwitches?.items && cb.equipment.disconnectSwitches.items.length > 0) {
               cb.equipment.disconnectSwitches.items.forEach(item => {
                  if (item.quantity > 0) {
                     rows.push([
                        'Sw',
                        item.name.substring(0, 25),
                        item.quantity.toString(),
                        this.formatCurrency(item.price),
                        this.formatCurrency(item.total)
                     ]);
                  }
               });
            }

            // Meters
            if (cb?.equipment?.meters?.items && cb.equipment.meters.items.length > 0) {
               cb.equipment.meters.items.forEach(item => {
                  if (item.quantity > 0) {
                     rows.push([
                        'Mtr',
                        item.name.substring(0, 25),
                        item.quantity.toString(),
                        this.formatCurrency(item.price),
                        this.formatCurrency(item.total)
                     ]);
                  }
               });
            }

            // Additional Equipment
            if (cb?.equipment?.additional && cb.equipment.additional.length > 0) {
               cb.equipment.additional.forEach(item => {
                  if (item.quantity > 0) {
                     rows.push([
                        'Add',
                        item.name.substring(0, 25),
                        item.quantity.toString(),
                        this.formatCurrency(item.price),
                        this.formatCurrency(item.total)
                     ]);
                  }
               });
            }

            // Draw all rows
            for (let i = 0; i < rows.length; i++) {
               const requiredSpace = 20;
               if (y + requiredSpace > this.maxY - 120) {
                  doc.addPage();
                  y = this.minY;
                  this.drawHeader(doc, true, 'SOLAR QUOTATION', quoteData.quotationReference,
                     quoteData.quotationNumber, this.formatDate(new Date()),
                     this.formatDate(quoteData.quotationExpiryDate));
                  y = this.drawSectionHeader(doc, y, 'SOLAR PV PROPOSAL');
                  y = this.drawTableHeader(doc, y, columns);
               }

               y = this.drawTableRow(doc, y, columns, rows[i], i === rows.length - 1);
            }

            y += 5;

            // Equipment Subtotal - Yellow color for amount
            const equipmentTotal = quoteData.calculatedEquipmentTotal || quoteData.equipmentCost || 0;
            doc.font(this.fonts.tableHeader).fontSize(8).fillColor('#000000');
            doc.text('SUBTOTAL (EQUIPMENT)', this.pageWidth - this.margin - 200, y, { width: 100, align: 'right' });
            doc.font(this.fonts.currency).fontSize(8).fillColor(this.colors.total);
            doc.text(this.formatCurrency(equipmentTotal), this.pageWidth - this.margin - 95, y, { width: 90, align: 'right' });
            doc.fillColor('#000000');
            y += 18;

            // Installation Cost Section
            y = this.drawSectionHeader(doc, y, 'INSTALLATION COST');

            const installColumns = [
               { label: 'Description', width: 300, align: 'left' },
               { label: 'Amount', width: 100, align: 'right' }
            ];
            y = this.drawTableHeader(doc, y, installColumns);

            const installationTotal = quoteData.calculatedInstallationTotal || quoteData.installationCost || 0;

            const installRows = [
               ['Equipment Cost', this.formatCurrency(equipmentTotal)],
               ['Installation Labor', this.formatCurrency(installationTotal)]
            ];

            installRows.forEach((row, index) => {
               y = this.drawTableRow(doc, y, installColumns, row, index === installRows.length - 1);
            });

            y += 5;

            // Grand Total - Yellow color for total amount
            const grandTotal = quoteData.calculatedTotalCost || quoteData.totalCost || 0;
            doc.font(this.fonts.title).fontSize(11).fillColor('#000000');
            doc.text('TOTAL INVESTMENT', this.margin, y);
            doc.font(this.fonts.currency).fontSize(11).fillColor(this.colors.total);
            doc.text(this.formatCurrency(grandTotal), this.pageWidth - this.margin - 95, y, { width: 90, align: 'right' });
            doc.fillColor('#000000');
            y += 20;

            // Payment Terms
            if (quoteData.paymentTerms && y + 35 < this.maxY) {
               y = this.drawSectionHeader(doc, y, 'PAYMENT TERMS');
               doc.font(this.fonts.body).fontSize(8).fillColor('#000000');
               doc.text(quoteData.paymentTerms, this.margin + 10, y, {
                  width: this.pageWidth - (this.margin * 2) - 10,
                  align: 'left'
               });
               y += 20;
            }

            // Remarks
            if (quoteData.remarks && y + 35 < this.maxY) {
               y = this.drawSectionHeader(doc, y, 'REMARKS');
               doc.font(this.fonts.body).fontSize(8).fillColor('#000000');
               doc.text(quoteData.remarks, this.margin + 10, y, {
                  width: this.pageWidth - (this.margin * 2) - 10,
                  align: 'left'
               });
            }

            // Footer
            this.drawFooter(doc, 1, 1, 'This is a computer-generated quotation. Terms and conditions apply.');

            doc.end();
         } catch (error) {
            console.error('PDF Generation Error:', error);
            reject(error);
         }
      });
   }

   // ============ PRE-ASSESSMENT PDF (2 Pages) ============
   async generatePreAssessmentPDF(assessmentData) {
      return new Promise((resolve, reject) => {
         try {
            const doc = new PDFDocument({
               margin: this.margin,
               size: 'A4',
               autoFirstPage: true
            });
            const chunks = [];

            // ✅ Register Roboto font at the beginning
            this.registerRobotoFont(doc);

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Page 1 - Main Assessment
            this.drawPreAssessmentPage1(doc, assessmentData).then(() => {
               // Page 2 - IoT & Site Analysis
               doc.addPage();
               this.drawPreAssessmentPage2(doc, assessmentData).then(() => {
                  doc.end();
               }).catch(reject);
            }).catch(reject);

         } catch (error) {
            reject(error);
         }
      });
   }

   // Page 1 content for Pre-Assessment
   async drawPreAssessmentPage1(doc, data) {
      let y = this.drawHeader(doc, true, 'PRE-ASSESSMENT REPORT', data.bookingReference,
         data.quotationNumber, this.formatDate(new Date()),
         this.formatDate(data.quotationExpiryDate));

      y = this.drawClientInfo(doc, y, data);
      y = this.drawSystemSpecs(doc, y, data);
      y = this.drawEquipmentTable(doc, y, data);
      y = this.drawInstallationCost(doc, y, data);

      // Payment terms if space allows - Black text
      if (data.paymentTerms && y + 60 < this.maxY) {
         y = this.drawSectionHeader(doc, y, 'PAYMENT TERMS');
         doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor('#000000');
         const termsShort = data.paymentTerms.length > 200 ? data.paymentTerms.substring(0, 197) + '...' : data.paymentTerms;
         doc.text(termsShort, this.margin + 10, y, { width: this.pageWidth - (this.margin * 2) - 10 });
      }

      this.drawFooter(doc, 1, 2);
   }

   // Page 2 content for Pre-Assessment - UPDATED with black text
   async drawPreAssessmentPage2(doc, data) {
      let y = this.drawHeader(doc, true, 'SITE FINDINGS & ANALYSIS', data.bookingReference,
         data.quotationNumber, null, null);

      // 7-Day Monitoring Results
      if (data.iotAnalysis) {
         y = this.drawSectionHeader(doc, y, '7-DAY MONITORING RESULTS');

         const iot = data.iotAnalysis;
         const leftColX = this.margin + 10;
         const rightColX = this.margin + 280;

         // Left column - Irradiance - Black text
         doc.font(this.fonts.sectionHeader).fontSize(8).fillColor('#000000');
         doc.text('Solar Irradiance', leftColX, y);
         y += 14;
         doc.font(this.fonts.body).fontSize(8).fillColor('#000000');
         doc.text(`Average: ${iot.averageIrradiance?.toFixed(0) || 0} W/m²`, leftColX + 10, y);
         y += 12;
         doc.text(`Range: ${iot.minIrradiance?.toFixed(0) || 0} - ${iot.maxIrradiance?.toFixed(0) || 0} W/m²`, leftColX + 10, y);
         y += 12;
         doc.text(`Peak Sun Hours: ${iot.peakSunHours?.toFixed(1) || 0} hrs/day`, leftColX + 10, y);
         y += 16;

         // Temperature - Black text
         doc.font(this.fonts.sectionHeader).fontSize(8).fillColor('#000000');
         doc.text('Temperature', leftColX, y);
         y += 14;
         doc.font(this.fonts.body).fontSize(8).fillColor('#000000');
         doc.text(`Average: ${iot.averageTemperature?.toFixed(1) || 0}°C`, leftColX + 10, y);
         y += 12;
         doc.text(`Range: ${iot.minTemperature?.toFixed(1) || 0}°C - ${iot.maxTemperature?.toFixed(1) || 0}°C`, leftColX + 10, y);
         y += 16;

         // Humidity - Black text
         doc.font(this.fonts.sectionHeader).fontSize(8).fillColor('#000000');
         doc.text('Humidity', leftColX, y);
         y += 14;
         doc.font(this.fonts.body).fontSize(8).fillColor('#000000');
         doc.text(`Average: ${iot.averageHumidity?.toFixed(0) || 0}%`, leftColX + 10, y);
         y += 12;
         doc.text(`Range: ${iot.minHumidity?.toFixed(0) || 0}% - ${iot.maxHumidity?.toFixed(0) || 0}%`, leftColX + 10, y);
         y += 16;

         // Right column - System Recommendations - Black text
         let rightY = y - 110;
         doc.font(this.fonts.sectionHeader).fontSize(8).fillColor('#000000');
         doc.text('System Recommendations', rightColX, rightY);
         rightY += 14;
         doc.font(this.fonts.body).fontSize(8).fillColor('#000000');
         doc.text(`Optimal Orientation: ${iot.optimalOrientation || 'South-facing'}`, rightColX + 10, rightY);
         rightY += 12;
         doc.text(`Optimal Tilt Angle: ${iot.optimalTiltAngle || 15}°`, rightColX + 10, rightY);
         rightY += 12;
         doc.text(`Recommended System Size: ${iot.recommendedSystemSize || data.systemSize} kWp`, rightColX + 10, rightY);
         rightY += 16;

         if (iot.siteSuitabilityScore) {
            doc.font(this.fonts.sectionHeader).fontSize(8).fillColor('#000000');
            doc.text('Site Suitability Score', rightColX, rightY);
            rightY += 14;
            doc.font(this.fonts.body).fontSize(8).fillColor('#000000');
            doc.text(`${iot.siteSuitabilityScore}/100`, rightColX + 10, rightY);
            rightY += 10;
         }

         y = Math.max(y, rightY);
         y += 10;
      }

      // Performance Estimates - Black text
      if (data.performanceEstimates) {
         const requiredSpace = 80;
         if (y + requiredSpace > this.maxY - 80) {
            doc.addPage();
            y = this.minY;
            this.drawHeader(doc, true, 'SITE FINDINGS & ANALYSIS', data.bookingReference,
               data.quotationNumber, null, null);
         }

         y = this.drawSectionHeader(doc, y, 'ESTIMATED PERFORMANCE');

         const pe = data.performanceEstimates;
         doc.font(this.fonts.body).fontSize(8).fillColor('#000000');
         doc.text(`Annual Production: ${pe.annualProduction?.toLocaleString() || 0} kWh`, this.margin + 10, y);
         y += 14;

         // Use black text for labels, yellow for amounts? No, keep all black for consistency
         doc.text(`Annual Savings: `, this.margin + 10, y);
         doc.font(this.fonts.currency).fontSize(8);
         doc.text(this.formatCurrency(pe.annualSavings), this.margin + 110, y, { width: 100, align: 'left' });
         doc.font(this.fonts.body);
         y += 14;

         if (pe.monthlySavings) {
            doc.text(`Monthly Savings: `, this.margin + 10, y);
            doc.font(this.fonts.currency).fontSize(8);
            doc.text(this.formatCurrency(pe.monthlySavings), this.margin + 110, y, { width: 100, align: 'left' });
            doc.font(this.fonts.body);
            y += 14;
         }

         doc.fillColor('#000000');
         doc.text(`Payback Period: ${pe.paybackPeriod || 0} years`, this.margin + 10, y);
         y += 14;
         doc.text(`CO₂ Reduction: ${pe.co2Offset?.toLocaleString() || 0} kg/year`, this.margin + 10, y);
         y += 20;
      }

      // Site Assessment - Black text
      if (data.siteAssessment) {
         const requiredSpace = 100;
         if (y + requiredSpace > this.maxY - 60) {
            doc.addPage();
            y = this.minY;
            this.drawHeader(doc, true, 'SITE FINDINGS & ANALYSIS', data.bookingReference,
               data.quotationNumber, null, null);
         }

         y = this.drawSectionHeader(doc, y, 'SITE ASSESSMENT');

         const sa = data.siteAssessment;
         doc.font(this.fonts.body).fontSize(8).fillColor('#000000');

         if (sa.roofCondition) {
            doc.text(`Roof Condition: ${sa.roofCondition}`, this.margin + 10, y);
            y += 14;
         }

         if (sa.roofLength && sa.roofWidth) {
            doc.text(`Roof Dimensions: ${sa.roofLength}m × ${sa.roofWidth}m (${(sa.roofLength * sa.roofWidth).toFixed(1)}m²)`,
               this.margin + 10, y);
            y += 14;
         }

         if (sa.structuralIntegrity) {
            doc.text(`Structural Integrity: ${sa.structuralIntegrity}`, this.margin + 10, y);
            y += 14;
         }

         if (sa.estimatedInstallationTime) {
            doc.text(`Installation Time: ${sa.estimatedInstallationTime} days`, this.margin + 10, y);
            y += 18;
         }

         // Engineer Recommendations at the bottom - Black text
         if (sa.recommendations) {
            y = this.drawSectionHeader(doc, y, 'Engineer Recommendations');
            doc.font(this.fonts.body).fontSize(7).fillColor('#000000');

            // Split long text into multiple lines
            const recommendations = sa.recommendations;
            const maxWidth = this.pageWidth - (this.margin * 2) - 20;
            const lines = [];
            let currentLine = '';

            for (let i = 0; i < recommendations.length; i++) {
               const char = recommendations[i];
               const testLine = currentLine + char;
               const textWidth = doc.widthOfString(testLine, { font: this.fonts.body, size: 7 });

               if (textWidth > maxWidth) {
                  lines.push(currentLine);
                  currentLine = char;
               } else {
                  currentLine = testLine;
               }
            }
            if (currentLine) lines.push(currentLine);

            lines.forEach(line => {
               doc.text(line, this.margin + 10, y, { width: maxWidth, align: 'left' });
               y += 12;
            });
         }
      }

      this.drawFooter(doc, 2, 2, 'This report is based on on-site assessment and 7-day IoT monitoring data.');
   }
}

module.exports = new PDFGenerator();