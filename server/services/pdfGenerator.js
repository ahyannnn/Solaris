const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class QuotationGenerator {
   constructor() {
      this.fonts = {
         regular: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
         bold: path.join(__dirname, '../fonts/Roboto-Bold.ttf')
      };

      // ==========================================================
      // FIXED ASSETS PATH
      // ==========================================================
      // If your assets folder is RIGHT NEXT to this JS file, use 'assets'
      // If it is ONE FOLDER UP from this JS file, use '../assets'
      this.assetsPath = path.join(__dirname, '../assets');

      this.colors = {
         tableHeader: '#92D050',
         totalBackground: '#FFFF00',
         black: '#000000',
         white: '#FFFFFF',
         border: '#000000'
      };

      this.margins = {
         top: 72,
         bottom: 72,
         left: 72,
         right: 72
      };
   }

   generateFreeQuotePDF(pdfData) {
      return new Promise((resolve, reject) => {
         try {
            const doc = new PDFDocument({
               margins: this.margins,
               size: 'A4'
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
               const pdfBuffer = Buffer.concat(buffers);
               resolve(pdfBuffer);
            });

            this._registerFonts(doc);
            this._generateFreeQuote(doc, pdfData);
            doc.end();
         } catch (error) {
            reject(error);
         }
      });
   }

   generatePreAssessmentPDF(pdfData) {
      return new Promise((resolve, reject) => {
         try {
            const doc = new PDFDocument({
               margins: this.margins,
               size: 'A4'
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
               const pdfBuffer = Buffer.concat(buffers);
               resolve(pdfBuffer);
            });

            this._registerFonts(doc);
            this._generatePreAssessment(doc, pdfData);
            doc.end();
         } catch (error) {
            reject(error);
         }
      });
   }

   _registerFonts(doc) {
      if (fs.existsSync(this.fonts.regular)) {
         doc.registerFont('Roboto', this.fonts.regular);
      }
      if (fs.existsSync(this.fonts.bold)) {
         doc.registerFont('Roboto-Bold', this.fonts.bold);
      }
   }

   _generateFreeQuote(doc, data) {
      // Page 1 - Header drawn by _drawHeader inside _drawPage1
      this._drawPage1(doc, data);
      this._drawFooter(doc, data);

      // Page 2 - Add logo via _drawPageLogo
      doc.addPage();
      this._drawPageLogo(doc);
      this._drawWarrantyAndTerms(doc, data);
      this._drawFooter(doc, data);


   }

   _generatePreAssessment(doc, data) {
      // Page 1 - Header drawn by _drawHeader inside _drawPage1
      this._drawPage1(doc, data);
      this._drawFooter(doc, data);

      // Page 2 - Add logo via _drawPageLogo
      doc.addPage();
      this._drawPageLogo(doc);
      this._drawAssessment(doc, data);
      this._drawIoTSummary(doc, data);
      this._drawPerformance(doc, data);
      this._drawRecommendations(doc, data);
      this._drawFooter(doc, data);

      // Page 3 - Add logo via _drawPageLogo
      doc.addPage();
      this._drawPageLogo(doc);
      this._drawWarrantyAndTerms(doc, data);
      this._drawFooter(doc, data);


   }

   _drawPage1(doc, data) {
      let y = this.margins.top;

      y = this._drawHeader(doc, data, y);
      y = this._drawClientInfo(doc, data, y);
      y = this._drawEquipmentTable(doc, data, y);
      y = this._drawPricing(doc, data, y);
   }

   _drawHeader(doc, data, y) {
      const leftX = this.margins.left;
      const rightX = doc.page.width - this.margins.right;
      const pageWidth = doc.page.width;
      const marginsTotal = this.margins.left + this.margins.right;
      const availableWidth = pageWidth - marginsTotal;

      // Company Logo - Spread from left to right
      const companyLogoPath = path.join(this.assetsPath, 'company_logo.png');
      if (fs.existsSync(companyLogoPath)) {
         try {
            doc.image(companyLogoPath, leftX, y, {
               width: availableWidth,  // Spread across the full available width
            });
            y += 60; // Space after logo (adjust based on actual logo height)
         } catch (e) {
            // Logo failed to load
         }
      }

      return y + 20;
   }

   // NEW: Method to draw logo on every page (except first page since it uses _drawHeader)
   _drawPageLogo(doc) {
      const leftX = this.margins.left;
      const pageWidth = doc.page.width;
      const marginsTotal = this.margins.left + this.margins.right;
      const availableWidth = pageWidth - marginsTotal;

      // Company Logo - Spread from left to right at top of page
      const companyLogoPath = path.join(this.assetsPath, 'company_logo.png');
      if (fs.existsSync(companyLogoPath)) {
         try {
            doc.image(companyLogoPath, leftX, 20, {  // Fixed position at top of page
               width: availableWidth,
            });
         } catch (e) {
            // Logo failed to load
         }
      }
   }

   // ==========================================================
   // 1. FLEXIBLE CLIENT INFO - Supports both Free Quote & Pre-Assessment
   // ==========================================================
   _drawClientInfo(doc, data, y) {
      const leftX = this.margins.left;
      const rightX = doc.page.width - this.margins.right;
      const rightColumnX = rightX - 140;

      // Detect document type
      const isPreAssessment = data.bookingReference || data.propertyType;
      const isFreeQuote = data.quotationNumber || data.clientName;

      // Use custom fields or defaults based on document type
      const leftFields = data.clientLeftFields || [
         {
            label: 'To:',
            value: data.clientName || 'Client Name',
            bold: true,
            fontSize: 10,
            valueFontSize: 9
         },
         {
            label: 'Address:',
            value: data.address || data.clientAddress || 'Client Address',
            bold: true,
            fontSize: 10,
            valueFontSize: 9
         },
         {
            label: 'Contact:',
            value: data.clientPhone || data.phone || 'N/A',
            bold: true,
            fontSize: 10,
            valueFontSize: 9
         }
      ];

      const rightFields = data.clientRightFields || [
         {
            label: isPreAssessment ? 'Booking Ref.:' : 'Quotation No.:',
            value: data.bookingReference || data.quotationNumber || data.refNumber || 'N/A',
            bold: true,
            fontSize: 10,
            valueFontSize: 9
         },
         {
            label: isPreAssessment ? 'Property Type:' : 'Type:',
            value: data.propertyType || data.systemTypeLabel || data.systemType || 'N/A',
            bold: true,
            fontSize: 10,
            valueFontSize: 9
         },
         {
            label: 'Capacity:',
            value: data.systemSize ? `${data.systemSize} kWp` : 'N/A',
            bold: true,
            fontSize: 10,
            valueFontSize: 9
         }
      ];

      // Draw rows
      const maxRows = Math.max(leftFields.length, rightFields.length);

      for (let i = 0; i < maxRows; i++) {
         // Left column
         if (i < leftFields.length) {
            const field = leftFields[i];
            doc.font(field.bold ? 'Roboto-Bold' : 'Roboto')
               .fontSize(field.fontSize || 10);

            const labelWidth = doc.widthOfString(field.label);
            doc.text(field.label, leftX, y, { continued: true });

            doc.font('Roboto')
               .fontSize(field.valueFontSize || 9)
               .text(` ${field.value}`, leftX + 5, y);
         }

         // Right column
         if (i < rightFields.length) {
            const field = rightFields[i];
            doc.font(field.bold ? 'Roboto-Bold' : 'Roboto')
               .fontSize(field.fontSize || 10);

            const labelWidth = doc.widthOfString(field.label);
            doc.text(field.label, rightColumnX, y, { continued: true });

            doc.font('Roboto')
               .fontSize(field.valueFontSize || 9)
               .text(` ${field.value}`, rightColumnX + 5, y);
         }

         y += 18;
      }

      // Optional: Add email if available
      if (data.clientEmail) {
         doc.font('Roboto-Bold')
            .fontSize(10)
            .text('Email:', leftX, y, { continued: true });
         doc.font('Roboto')
            .fontSize(9)
            .text(` ${data.clientEmail}`, leftX + doc.widthOfString('Email:') + 2, y);
         y += 18;
      }

      // Optional: Add date for free quote
      if (isFreeQuote && data.date) {
         doc.font('Roboto-Bold')
            .fontSize(10)
            .text('Date:', leftX, y, { continued: true });
         doc.font('Roboto')
            .fontSize(9)
            .text(` ${data.date}`, leftX + doc.widthOfString('Date:') + 2, y);
         y += 18;
      }

      // Divider line
      y += 10;
      doc.moveTo(leftX, y)
         .lineTo(rightX, y)
         .stroke();

      return y + 15;
   }

   // ==========================================================
   // 2. FLEXIBLE EQUIPMENT TABLE - Supports both document types
   // ==========================================================
   _drawEquipmentTable(doc, data, y) {
      const leftX = this.margins.left;
      const rightX = doc.page.width - this.margins.right;
      const tableWidth = rightX - leftX;

      // Flexible column widths - can be overridden by data
      const colWidths = data.tableColWidths || {
         item: tableWidth * 0.06,
         description: tableWidth * 0.44,
         qty: tableWidth * 0.10,
         unit: tableWidth * 0.10,
         logo: tableWidth * 0.30
      };

      // Calculate where the line should end (after UNIT column) - for item-unit line
      const lineEndX = leftX + colWidths.item + colWidths.description + colWidths.qty + colWidths.unit;

      // Build equipment items from data (supports both structures)
      const equipmentItems = this._buildFlexibleEquipmentItems(data);
      const categories = this._groupItemsByCategory(equipmentItems);

      if (categories.length === 0) {
         doc.font('Roboto')
            .fontSize(10)
            .text('No equipment items available.', leftX, y);
         return y + 20;
      }

      // Draw header
      doc.font('Roboto-Bold')
         .fontSize(9);

      let headerY = y;
      doc.rect(leftX, headerY, tableWidth, 20)
         .fill(this.colors.tableHeader)
         .stroke(this.colors.border);

      doc.fillColor(this.colors.black);

      // Flexible headers - can be overridden by data
      const headers = data.tableHeaders || {
         item: 'ITEM',
         description: 'DESCRIPTION',
         qty: 'QTY',
         unit: 'UNIT',
         logo: 'PARTNER LOGO'
      };

      //line here - FULL LINE from left to right
      doc.moveTo(leftX, headerY + 20)
         .lineTo(rightX, headerY + 20)
         .stroke();

      doc.text(headers.item, leftX + 2, headerY + 4, { width: colWidths.item, align: 'left' });
      doc.text(headers.description, leftX + colWidths.item + 2, headerY + 4, { width: colWidths.description, align: 'left' });
      doc.text(headers.qty, leftX + colWidths.item + colWidths.description + 2, headerY + 4, { width: colWidths.qty, align: 'center' });
      doc.text(headers.unit, leftX + colWidths.item + colWidths.description + colWidths.qty + 2, headerY + 4, { width: colWidths.unit, align: 'center' });
      doc.text(headers.logo, leftX + colWidths.item + colWidths.description + colWidths.qty + colWidths.unit + 2, headerY + 4, { width: colWidths.logo, align: 'center' });

      //line here - FULL LINE from left to right
      doc.moveTo(leftX, headerY + 20)
         .lineTo(rightX, headerY + 20)
         .stroke();

      y += 20;
      let rowY = y;

      // Track if logos have been displayed
      let logosDisplayed = false;

      for (const category of categories) {
         const estimatedHeight = 20 + (category.items.length * 25);
         if (rowY + estimatedHeight > doc.page.height - this.margins.bottom - 80) {
            doc.addPage();
            this._drawPageLogo(doc);
            rowY = this.margins.top + 60;
            this._drawFlexibleTableHeader(doc, leftX, tableWidth, colWidths, headers, rowY);
            rowY += 20;
            logosDisplayed = false;
         }

         doc.font('Roboto-Bold')
            .fontSize(9)
            .text(category.name, leftX + 2, rowY + 2, { width: tableWidth - 4 });

         rowY += 15;

         for (const item of category.items) {
            if (rowY + 25 > doc.page.height - this.margins.bottom - 80) {
               doc.addPage();
               this._drawPageLogo(doc);
               rowY = this.margins.top + 60;
               this._drawFlexibleTableHeader(doc, leftX, tableWidth, colWidths, headers, rowY);
               rowY += 20;
               logosDisplayed = false;
            }

            doc.font('Roboto')
               .fontSize(8);

            // Build description with optional details
            let description = item.description || '';
            if (data.showItemDetails && item.details) {
               description += ` (${item.details})`;
            }

            const itemText = item.itemNumber || '';
            doc.text(itemText, leftX + 2, rowY + 8, { width: colWidths.item, align: 'left' });
            doc.text(description, leftX + colWidths.item + 2, rowY + 8, { width: colWidths.description, align: 'left' });
            doc.text((item.quantity || item.qty || 0).toString(), leftX + colWidths.item + colWidths.description + 2, rowY + 8, { width: colWidths.qty, align: 'center' });
            doc.text(item.unit || '', leftX + colWidths.item + colWidths.description + colWidths.qty + 2, rowY + 8, { width: colWidths.unit, align: 'center' });

            const logoX = leftX + colWidths.item + colWidths.description + colWidths.qty + colWidths.unit + 2;
            const logoWidth = colWidths.logo - 4;

            // Display partner logos only once
            if (!logosDisplayed && !data.hidePartnerLogos) {
               this._drawPartnerLogos(doc, logoX, rowY, logoWidth);
               logosDisplayed = true;
            } else {
               doc.text('', logoX, rowY + 8, { width: logoWidth, align: 'center' });
            }

            rowY += 25;

            // ==========================================================
            // ITEM-UNIT LINE: Line only from left edge to end of UNIT column
            // (No line in the PARTNER LOGO column)
            // ==========================================================
            doc.moveTo(leftX, rowY)      // Start at left edge
               .lineTo(lineEndX, rowY)    // End after UNIT column
               .stroke();
            // ==========================================================
         }
      }

      return rowY + 10;
   }

   // ==========================================================
   // 3. FLEXIBLE PRICING - Supports both document types
   // ==========================================================
   _drawPricing(doc, data, y) {
      const leftX = this.margins.left;
      const rightX = doc.page.width - this.margins.right;
      const tableWidth = rightX - leftX;
      const labelWidth = tableWidth * 0.60;
      const valueWidth = tableWidth * 0.40;

      y += 10;

      // Currency from data or default
      const currency = data.currency || '₱';

      // Calculate values - supports both data structures
      const equipmentTotal = data.calculatedEquipmentTotal ||
         data.costBreakdown?.equipment?.panels?.total ||
         data.equipmentCost || 0;

      const installationTotal = data.calculatedInstallationTotal ||
         data.costBreakdown?.installation?.total ||
         data.installationCost || 0;

      const totalCost = equipmentTotal + installationTotal;
      const discount = data.discount || data.lessDiscount || 0;
      const totalPackagePrice = totalCost - discount;

      // ROI Section (configurable)
      if (data.showROI !== false) {
         doc.font('Roboto-Bold')
            .fontSize(10)
            .text('Return of Investment', leftX, y);

         y += 15;

         let roiValue = data.roiYears || data.calculatedRoiYears || data.roiData;
         if (typeof roiValue === 'number' && roiValue > 0) {
            roiValue = roiValue.toFixed(1) + ' years';
         } else if (typeof roiValue === 'number') {
            roiValue = 'N/A';
         } else if (!roiValue || roiValue === 'N/A') {
            // Calculate ROI if possible
            if (totalPackagePrice > 0 && data.annualProduction) {
               const annualSavings = data.annualProduction * (data.ratePerKwh || 12);
               const calculatedRoi = totalPackagePrice / annualSavings;
               roiValue = calculatedRoi.toFixed(1) + ' years';
            } else {
               roiValue = 'N/A';
            }
         }
         doc.font('Roboto')
            .fontSize(9)
            .text(`ROI: ${typeof roiValue === 'number' ? roiValue.toFixed(1) + ' years' : roiValue}`, leftX + 5, y);

         //line here - FULL LINE from left to right
         doc.moveTo(leftX, y + 12)
            .lineTo(rightX, y + 12)
            .stroke();

         y += 20;
      }

      // Header
      doc.font('Roboto-Bold')
         .fontSize(10)
         .text('TOTAL SOLAR PACKAGE COST OPTIONS (VAT EX)', leftX, y);

      y += 15;

      // Pricing items - exactly as requested
      const pricingItems = [];

      // Total Cost (Equipment + Installation)
      pricingItems.push({
         label: 'Total Cost',
         value: data.calculatedTotalCost,
         isTotal: false
      });

      // Less Discount - Always show with ₱0.00 if null/undefined
      pricingItems.push({
         label: 'Less Discount',
         value: data.discountAmount || 0, // Will be 0 if null/undefined
         isTotal: false,
         isDiscount: true
      });

      // TOTAL PACKAGE PRICE
      pricingItems.push({
         label: 'TOTAL PACKAGE PRICE',
         value: data.finalAmount,
         isTotal: true
      });

      // Draw pricing items
      for (const item of pricingItems) {
         if (y > doc.page.height - this.margins.bottom - 50) {
            doc.addPage();
            this._drawPageLogo(doc);
            y = this.margins.top + 60;
         }

         const formattedValue = `${currency}${item.value.toFixed(2)}`;

         if (item.isDiscount && item.value > 0) {
            doc.fillColor('#FF0000'); // Red color for discount
         } else {
            doc.fillColor(this.colors.black);
         }

         doc.font(item.isTotal ? 'Roboto-Bold' : 'Roboto')
            .fontSize(item.isTotal ? 10 : 9)
            .text(item.label, leftX, y, { width: labelWidth });

         if (item.isTotal) {
            const x = leftX + labelWidth;

            doc.fillColor(this.colors.black)
               .font('Roboto-Bold')
               .fontSize(10)
               .text(formattedValue, x, y, {
                  width: valueWidth,
                  align: 'right'
               });
         } else {
            doc.text(formattedValue, leftX + labelWidth, y, {
               width: valueWidth,
               align: 'right'
            });
         }

         //line here - FULL LINE from left to right
         doc.moveTo(leftX, y + (item.isTotal ? 18 : 16))
            .lineTo(rightX, y + (item.isTotal ? 18 : 16))
            .stroke();

         y += item.isTotal ? 20 : 18;
      }

      // Additional notes
      if (data.pricingNotes) {
         y += 10;
         doc.font('Roboto')
            .fontSize(8)
            .text(data.pricingNotes, leftX, y, {
               width: tableWidth,
               align: 'left',
               color: '#666666'
            });
         y += 15;
      }

      return y + 10;
   }
   // ==========================================================
   // HELPER METHODS
   // ==========================================================

   _buildFlexibleEquipmentItems(data) {
      const items = [];
      let counter = 1;

      // Get equipment from either data structure
      const equipment = data.costBreakdown?.equipment || data.equipment || {};

      // Standard equipment mapping
      const equipmentMap = [
         { key: 'panels', category: 'SOLAR PV MODULES', unit: 'pcs' },
         { key: 'mountingStructure', category: 'MOUNTING STRUCTURE', unit: 'set' },
         { key: 'inverter', category: 'INVERTERS, COMBINERS AND PROTECTION DEVICES', unit: 'pcs' },
         { key: 'battery', category: 'BATTERY SYSTEM', unit: 'pcs' }
      ];

      for (const eq of equipmentMap) {
         if (equipment[eq.key] && equipment[eq.key].quantity > 0) {
            const item = {
               category: eq.category,
               itemNumber: `${counter}.1`,
               description: equipment[eq.key].name || eq.key,
               quantity: equipment[eq.key].quantity || 0,
               unit: equipment[eq.key].unit || eq.unit
            };

            // Add details if available
            if (equipment[eq.key].brand || equipment[eq.key].model) {
               item.details = `${equipment[eq.key].brand || ''} ${equipment[eq.key].model || ''}`.trim();
            }

            items.push(item);
            counter++;
         }
      }

      // Cables
      if (equipment.cables?.items?.length > 0) {
         for (let i = 0; i < equipment.cables.items.length; i++) {
            const cable = equipment.cables.items[i];
            items.push({
               category: 'CABLES',
               itemNumber: `${counter}.${i + 1}`,
               description: cable.name || 'Cable',
               quantity: cable.quantity || 0,
               unit: cable.unit || 'm'
            });
         }
         counter++;
      }

      // Electrical components (grounding)
      if (equipment.electricalComponents?.items?.length > 0) {
         const groundingItems = equipment.electricalComponents.items.filter(item =>
            item.category === 'Grounding' || item.name?.toLowerCase().includes('ground')
         );
         if (groundingItems.length > 0) {
            for (let i = 0; i < groundingItems.length; i++) {
               const item = groundingItems[i];
               items.push({
                  category: 'GROUNDING',
                  itemNumber: `${counter}.${i + 1}`,
                  description: item.name || 'Grounding Component',
                  quantity: item.quantity || 0,
                  unit: item.unit || 'pcs'
               });
            }
            counter++;
         }
      }

      // Custom equipment items
      if (data.customEquipmentItems) {
         for (const customItem of data.customEquipmentItems) {
            items.push({
               category: customItem.category || 'OTHER',
               itemNumber: `${counter}.1`,
               description: customItem.description || customItem.name || 'Custom Item',
               quantity: customItem.quantity || 0,
               unit: customItem.unit || 'pcs',
               details: customItem.details || null
            });
            counter++;
         }
      }

      // Standard services (configurable)
      if (data.includeStandardServices !== false) {
         items.push({
            category: 'SITE SUPERVISION',
            itemNumber: `${counter}.1`,
            description: 'Site Supervision and Management',
            quantity: 1,
            unit: 'IoT'
         });
         counter++;

         items.push({
            category: 'ENGINEERING',
            itemNumber: `${counter}.1`,
            description: 'Engineering Design and Planning',
            quantity: 1,
            unit: 'IoT'
         });
         counter++;
      }

      // Installation labor
      const installationTotal = data.costBreakdown?.installation?.total ||
         data.calculatedInstallationTotal || data.installationCost || 0;
      if (installationTotal > 0 && data.includeInstallation !== false) {
         items.push({
            category: 'LABOR / INSTALLATION',
            itemNumber: `${counter}.1`,
            description: data.installationDescription || 'Installation Labor',
            quantity: 1,
            unit: 'IoT'
         });
         counter++;
      }

      return items;
   }

   _drawFlexibleTableHeader(doc, leftX, tableWidth, colWidths, headers, y) {
      doc.font('Roboto-Bold')
         .fontSize(9);

      doc.rect(leftX, y, tableWidth, 20)
         .fill(this.colors.tableHeader)
         .stroke(this.colors.border);

      doc.fillColor(this.colors.black);
      doc.text(headers.item, leftX + 2, y + 4, { width: colWidths.item, align: 'left' });
      doc.text(headers.description, leftX + colWidths.item + 2, y + 4, { width: colWidths.description, align: 'left' });
      doc.text(headers.qty, leftX + colWidths.item + colWidths.description + 2, y + 4, { width: colWidths.qty, align: 'center' });
      doc.text(headers.unit, leftX + colWidths.item + colWidths.description + colWidths.qty + 2, y + 4, { width: colWidths.unit, align: 'center' });
      doc.text(headers.logo, leftX + colWidths.item + colWidths.description + colWidths.qty + colWidths.unit + 2, y + 4, { width: colWidths.logo, align: 'center' });
   }

   _drawPartnerLogos(doc, x, y, logoWidth) {
      // List of all partner logos
      const logoFiles = [
         'aiko_logo.png',
         'longi_logo.png',
         'jinko_logo.png',
         'deye_logo.png',
         'luxpower_logo.png',
         'sunsynk_logo.png',
         'dyness_logo.png',
         'lvtopsun_logo.png'
      ];

      // Filter logos that actually exist in the assets folder
      const existingLogos = logoFiles
         .map(logo => path.join(this.assetsPath, logo))
         .filter(logoPath => fs.existsSync(logoPath));

      // If no logos exist, display a dash
      if (existingLogos.length === 0) {
         doc.text('-', x, y + 8, { width: logoWidth, align: 'center' });
         return;
      }

      try {
         // Calculate appropriate logo size - make them bigger since they're only shown once
         const maxHeight = 200; // Allow more height for all logos
         const maxWidth = 200; // Maximum width for each logo
         const baseSize = 30; // Bigger size since they're only shown once
         const spacing = 5;

         let logoSize = baseSize;
         const totalHeight = existingLogos.length * (logoSize + spacing);

         // Ensure logo doesn't exceed max width
         logoSize = Math.min(logoSize, maxWidth);

         // Draw all logos vertically stacked
         let currentY = y;
         for (const logoPath of existingLogos) {
            doc.image(logoPath, x + (logoWidth / 2) - (logoSize / 2), currentY, {
               width: 60,
               height: 30, // Maintain aspect ratio by setting both width and height
               align: 'center'
            });
            currentY += logoSize + spacing;
         }
      } catch (e) {
         // If there's an error loading logos, display a dash
         doc.text('-', x, y + 8, { width: logoWidth, align: 'center' });
      }
   }

   _drawTableHeader(doc, leftX, tableWidth, colWidths, y) {
      doc.font('Roboto-Bold')
         .fontSize(9);

      doc.rect(leftX, y, tableWidth, 20)
         .fill(this.colors.tableHeader)
         .stroke(this.colors.border);

      doc.fillColor(this.colors.black);
      doc.text('ITEM', leftX + 2, y + 4, { width: colWidths.item, align: 'left' });
      doc.text('DESCRIPTION', leftX + colWidths.item + 2, y + 4, { width: colWidths.description, align: 'left' });
      doc.text('QTY', leftX + colWidths.item + colWidths.description + 2, y + 4, { width: colWidths.qty, align: 'center' });
      doc.text('UNIT', leftX + colWidths.item + colWidths.description + colWidths.qty + 2, y + 4, { width: colWidths.unit, align: 'center' });
      doc.text('PARTNER LOGO', leftX + colWidths.item + colWidths.description + colWidths.qty + colWidths.unit + 2, y + 4, { width: colWidths.logo, align: 'center' });
   }

   _buildEquipmentItems(data) {
      const items = [];
      let counter = 1;

      const equipment = data.costBreakdown?.equipment || {};

      if (equipment.panels && equipment.panels.quantity > 0) {
         items.push({
            category: 'SOLAR PV MODULES',
            itemNumber: `${counter}.1`,
            description: equipment.panels.name || 'Solar Panels',
            quantity: equipment.panels.quantity || 0,
            unit: 'pcs'
         });
         counter++;
      }

      if (equipment.mountingStructure && equipment.mountingStructure.quantity > 0) {
         items.push({
            category: 'MOUNTING STRUCTURE',
            itemNumber: `${counter}.1`,
            description: equipment.mountingStructure.name || 'Mounting Structure',
            quantity: equipment.mountingStructure.quantity || 0,
            unit: 'set'
         });
         counter++;
      }

      if (equipment.inverter && equipment.inverter.quantity > 0) {
         items.push({
            category: 'INVERTERS, COMBINERS AND PROTECTION DEVICES',
            itemNumber: `${counter}.1`,
            description: equipment.inverter.name || 'Inverter',
            quantity: equipment.inverter.quantity || 0,
            unit: 'pcs'
         });
         counter++;
      }

      if (equipment.battery && equipment.battery.quantity > 0) {
         items.push({
            category: 'BATTERY SYSTEM',
            itemNumber: `${counter}.1`,
            description: equipment.battery.name || 'Battery System',
            quantity: equipment.battery.quantity || 0,
            unit: 'pcs'
         });
         counter++;
      }

      if (equipment.cables && equipment.cables.items && equipment.cables.items.length > 0) {
         for (let i = 0; i < equipment.cables.items.length; i++) {
            const cable = equipment.cables.items[i];
            items.push({
               category: 'CABLES',
               itemNumber: `${counter}.${i + 1}`,
               description: cable.name || 'Cable',
               quantity: cable.quantity || 0,
               unit: cable.unit || 'm'
            });
         }
         counter++;
      }

      if (equipment.electricalComponents && equipment.electricalComponents.items && equipment.electricalComponents.items.length > 0) {
         const groundingItems = equipment.electricalComponents.items.filter(item =>
            item.category === 'Grounding' || item.name?.toLowerCase().includes('ground')
         );
         if (groundingItems.length > 0) {
            for (let i = 0; i < groundingItems.length; i++) {
               const item = groundingItems[i];
               items.push({
                  category: 'GROUNDING',
                  itemNumber: `${counter}.${i + 1}`,
                  description: item.name || 'Grounding Component',
                  quantity: item.quantity || 0,
                  unit: item.unit || 'pcs'
               });
            }
            counter++;
         }
      }

      items.push({
         category: 'SITE SUPERVISION',
         itemNumber: `${counter}.1`,
         description: 'Site Supervision and Management',
         quantity: 1,
         unit: 'IoT'
      });
      counter++;

      items.push({
         category: 'ENGINEERING',
         itemNumber: `${counter}.1`,
         description: 'Engineering Design and Planning',
         quantity: 1,
         unit: 'IoT'
      });
      counter++;

      const installationTotal = data.costBreakdown?.installation?.total ||
         data.calculatedInstallationTotal || 0;
      if (installationTotal > 0) {
         items.push({
            category: 'LABOR / INSTALLATION',
            itemNumber: `${counter}.1`,
            description: 'Installation Labor',
            quantity: 1,
            unit: 'IoT'
         });
         counter++;
      }

      return items;
   }

   _drawWarrantyAndTerms(doc, data) {
      let y = this.margins.top + 60; // Start after logo
      const centerX = doc.page.width / 2;

      // WARRANTY SECTION - Centered
      doc.font('Roboto-Bold')
         .fontSize(14)
         .text('WARRANTY', this.margins.left, y, {
            width: doc.page.width - this.margins.left - this.margins.right,
            align: 'center'
         });

      y += 25;

      // Warranty items - using bullet points
      const warranties = [
         '12 years product warranty / 25 years life span in Solar Panels',
         '5 years product warranty on inverter',
         '5 years product warranty on batteries with 8 to 12 years lifespan',
         '1 year workmanship warranty'
      ];

      for (const warranty of warranties) {
         if (y > doc.page.height - this.margins.bottom - 80) {
            doc.addPage();
            this._drawPageLogo(doc);
            y = this.margins.top + 60;
            // Redraw heading on new page
            doc.font('Roboto-Bold')
               .fontSize(14)
               .text('WARRANTY', centerX, y, {
                  align: 'center',
                  width: doc.page.width - this.margins.left - this.margins.right
               });
            y += 25;
         }

         doc.font('Roboto')
            .fontSize(10)
            .text(`• ${warranty}`, this.margins.left + 10, y, {
               width: doc.page.width - this.margins.left - this.margins.right - 30
            });

         y += 18;
      }

      y += 15;

      // TERMS OF PAYMENT AND CONDITIONS SECTION - Centered
      doc.font('Roboto-Bold')
         .fontSize(14)
         .text('TERMS OF PAYMENT AND CONDITIONS', this.margins.left, y, {
            width: doc.page.width - this.margins.left - this.margins.right,
            align: 'center'
         });

      y += 25;

      const paymentText = data.paymentTerms || 'All payments will be accepted in terms of dated cheque or bank deposit only.';

      const termsData = [
         {
            title: '1. Price',
            content: 'Package quoted is for equipment supply cost. VAT EXCLUSIVE. Add 12% for Receipts / SI. Any additional civil works are not included.'
         },
         {
            title: '2. Validity',
            content: 'Quoted prices are only valid for 30-days from the date of project proposal stated herein.'
         },
         {
            title: '3. Delivery',
            content: 'Free delivery of equipment. Items will be delivered after receipt of downpayment.'
         },
         {
            title: '4. Payment',
            content: 'All payments will be accepted in terms of dated cheque or bank deposit only.'
         },
         {
            title: '5. Warranty Claim',
            content: 'If warranty is void, then the item may be subject to repair cost if repairable.'
         },
         {
            title: '6. After Sales Support',
            content: 'The company offers free after sales support thru our customer care (+63997)6524065, from Monday to Saturday 9:00am-5:00pm. Maintenance cost may vary and change without any prior notice.'
         }
      ];

      for (const term of termsData) {
         if (y > doc.page.height - this.margins.bottom - 80) {
            doc.addPage();
            this._drawPageLogo(doc);
            y = this.margins.top + 60;
            // Redraw heading on new page
            doc.font('Roboto-Bold')
               .fontSize(14)
               .text('TERMS OF PAYMENT AND CONDITIONS', centerX, y, {
                  align: 'center',
                  width: doc.page.width - this.margins.left - this.margins.right
               });
            y += 25;
         }

         // Term title (bold) - Indented to match the content
         doc.font('Roboto-Bold')
            .fontSize(10)
            .text(term.title, this.margins.left + 15, y);

         y += 15;

         // Term content (regular)
         doc.font('Roboto')
            .fontSize(9)
            .text(term.content, this.margins.left + 30, y, {
               width: doc.page.width - this.margins.left - this.margins.right - 50
            });

         y += 20;
      }
   }

   _drawSignature(doc, data) {
      const leftX = this.margins.left;
      const rightX = doc.page.width - this.margins.right;
      let y = doc.page.height - this.margins.bottom - 120;

      if (y < this.margins.top + 50) {
         doc.addPage();
         this._drawPageLogo(doc); // Add logo on new page
         y = doc.page.height - this.margins.bottom - 120;
      }

      doc.font('Roboto-Bold')
         .fontSize(10)
         .text('Prepared By:', leftX, y);

      y += 20;
      doc.font('Roboto')
         .fontSize(9)
         .text(data.engineerName || 'Engineer Name', leftX, y);

      y += 15;
      doc.text(data.engineerSignature || 'Engineer Signature', leftX, y);

      doc.font('Roboto-Bold')
         .fontSize(10)
         .text('Conforme:', rightX - 150, y - 35);

      y += 20;
      doc.font('Roboto')
         .fontSize(9)
         .text(data.clientName || 'Client Name', rightX - 150, y);

      y += 15;
      doc.text(data.clientSignature || 'Client Signature', rightX - 150, y);

      const lineY = y + 20;
      doc.moveTo(leftX, lineY)
         .lineTo(rightX, lineY)
         .stroke();
   }

   _drawFooter(doc, data) {
      const y = doc.page.height - this.margins.bottom - 20;

      doc.font('Roboto')
         .fontSize(8)
         .text('SALFER ENGINEERING AND SOLAR TECHNOLOGY ENTERPRISE',
            this.margins.left, y, {
            width: doc.page.width - this.margins.left - this.margins.right,
            align: 'center'
         });
   }

   _drawAssessment(doc, data) {
      let y = this.margins.top + 60; // Start after logo

      doc.font('Roboto-Bold')
         .fontSize(14)
         .text('SITE ASSESSMENT SUMMARY', this.margins.left, y, {
            width: doc.page.width - this.margins.left - this.margins.right,
            align: 'center'
         });
      y += 25;

      const siteData = data.siteAssessment || {};
      const assessmentData = [
         { label: 'Roof Condition', value: siteData.roofCondition || 'N/A' },
         { label: 'Roof Length', value: siteData.roofLength || 'N/A' },
         { label: 'Roof Width', value: siteData.roofWidth || 'N/A' },
         { label: 'Structural Integrity', value: siteData.structuralIntegrity || 'N/A' },
         { label: 'Estimated Time', value: siteData.estimatedInstallationTime + ' days' || 'N/A' }
      ];

      for (const item of assessmentData) {
         doc.font('Roboto-Bold')
            .fontSize(10)
            .text(`${item.label}:`, this.margins.left, y);

         doc.font('Roboto')
            .fontSize(9)
            .text(item.value, this.margins.left + 100, y, {
               width: doc.page.width - this.margins.left - this.margins.right - 110,
               align: 'right'
            });

         y += 18;
      }
   }

   _drawIoTSummary(doc, data) {
      let y = this.margins.top + 190; // Start after logo + assessment

      doc.font('Roboto-Bold')
         .fontSize(14)
         .text('IoT SUMMARY', this.margins.left, y, {
            width: doc.page.width - this.margins.left - this.margins.right,
            align: 'center'
         });

      y += 25;

      const iot = data.iotAnalysis || {};
      const iotData = [
         { label: 'Average Irradiance', value: iot.averageIrradiance ? `${iot.averageIrradiance} W/m²` : 'N/A' },
         { label: 'Peak Sun Hours', value: iot.peakSunHours ? `${iot.peakSunHours} hours` : 'N/A' },
         { label: 'Temperature', value: iot.averageTemperature ? `${iot.averageTemperature}°C` : 'N/A' },
         { label: 'Humidity', value: iot.averageHumidity ? `${iot.averageHumidity}%` : 'N/A' },
        
      ];

      for (const item of iotData) {
         doc.font('Roboto-Bold')
            .fontSize(10)
            .text(`${item.label}:`, this.margins.left, y);

         doc.font('Roboto')
            .fontSize(9)
            .text(item.value, this.margins.left + 100, y, {
               width: doc.page.width - this.margins.left - this.margins.right - 110,
               align: 'right'
            });

         y += 18;
      }
   }

   _drawPerformance(doc, data) {
      let y = this.margins.top + 340; // Start after logo + assessment + IoT

      doc.font('Roboto-Bold')
         .fontSize(14)
         .text('PERFORMANCE SUMMARY', this.margins.left, y, {
            width: doc.page.width - this.margins.left - this.margins.right,
            align: 'center'
         });

      y += 25;

      const perf = data.performanceEstimates || {};
      const performanceData = [
         { label: 'Annual Production', value: perf.annualProduction ? `${perf.annualProduction.toFixed(0)} kWh/year` : 'N/A' },
         { label: 'CO₂ Offset', value: perf.co2Offset ? `${perf.co2Offset.toFixed(0)} kg/year` : 'N/A' },
         { label: 'ROI / Payback Period', value: perf.paybackPeriod ? `${perf.paybackPeriod} years` : 'N/A' },
         
      ];

      for (const item of performanceData) {
         doc.font('Roboto-Bold')
            .fontSize(10)
            .text(`${item.label}:`, this.margins.left, y);

         doc.font('Roboto')
            .fontSize(9)
            .text(item.value, this.margins.left + 100, y, {
               width: doc.page.width - this.margins.left - this.margins.right - 110,
               align: 'right'
            });

         y += 18;
      }
   }

   _drawRecommendations(doc, data) {
      let y = this.margins.top + 490; // Start after logo + assessment + IoT + performance

      doc.font('Roboto-Bold')
         .fontSize(14)
         .text('ENGINEER RECOMMENDATIONS', this.margins.left, y, {
            width: doc.page.width - this.margins.left - this.margins.right,
            align: 'center'
         });

      y += 25;

      const recommendations = data.siteAssessment?.recommendations || [];

      if (recommendations && recommendations.length > 0) {

         let recommendationList = recommendations;

         if (typeof recommendations === 'string') {
            recommendationList = recommendations.split(/(?<=[.!?])\s+|[\r\n]+/).filter(r => r.trim().length > 0);

            if (recommendationList.length <= 1 && recommendations.includes(',')) {
               recommendationList = recommendations.split(',').map(r => r.trim()).filter(r => r.length > 0);
            }
         }

         for (const recommendation of recommendationList) {
            if (y > doc.page.height - this.margins.bottom - 50) {
               doc.addPage();
               this._drawPageLogo(doc); // Add logo on new page
               y = this.margins.top + 60; // Adjust for logo space
            }

            doc.font('Roboto')
               .fontSize(9)
               .text(`• ${recommendation}`, this.margins.left + 10, y, {
                  width: doc.page.width - this.margins.left - this.margins.right - 20
               });

            y += 15;
         }

      } else {
         const iot = data.iotAnalysis || {};
         const defaultRecs = [
            iot.optimalOrientation ? `Orient panels ${iot.optimalOrientation} for optimal sunlight exposure` : null,
            iot.optimalTiltAngle ? `Set tilt angle to ${iot.optimalTiltAngle}° for maximum efficiency` : null,
            data.systemSize ? `System capacity recommended: ${data.systemSize} kWp based on site assessment` : null
         ].filter(Boolean);

         if (defaultRecs.length > 0) {
            for (const rec of defaultRecs) {
               if (y > doc.page.height - this.margins.bottom - 50) {
                  doc.addPage();
                  this._drawPageLogo(doc); // Add logo on new page
                  y = this.margins.top + 60; // Adjust for logo space
               }

               doc.font('Roboto')
                  .fontSize(9)
                  .text(`• ${rec}`, this.margins.left + 10, y, {
                     width: doc.page.width - this.margins.left - this.margins.right - 20
                  });

               y += 15;
            }
         } else {
            doc.font('Roboto')
               .fontSize(9)
               .text('No specific recommendations available.', this.margins.left + 10, y);
         }
      }
   }

   _groupItemsByCategory(items) {
      const categoryMap = new Map();

      const categoryOrder = [
         'SOLAR PV MODULES',
         'MOUNTING STRUCTURE',
         'INVERTERS, COMBINERS AND PROTECTION DEVICES',
         'BATTERY SYSTEM',
         'CABLES',
         'GROUNDING',
         'SITE SUPERVISION',
         'ENGINEERING',
         'LABOR / INSTALLATION'
      ];

      for (const item of items) {
         const category = item.category || 'OTHER';
         if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
         }
         categoryMap.get(category).push(item);
      }

      const grouped = [];
      for (const category of categoryOrder) {
         if (categoryMap.has(category)) {
            grouped.push({
               name: category,
               items: categoryMap.get(category)
            });
         }
      }

      for (const [category, items] of categoryMap) {
         if (!categoryOrder.includes(category)) {
            grouped.push({
               name: category,
               items: items
            });
         }
      }

      return grouped;
   }
}

module.exports = new QuotationGenerator();