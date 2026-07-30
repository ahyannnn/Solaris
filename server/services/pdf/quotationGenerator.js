const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class QuotationGenerator {
  constructor() {
    this.fonts = {
      regular: path.join(__dirname, '../../fonts/Roboto-Regular.ttf'),
      bold: path.join(__dirname, '../../fonts/Roboto-Bold.ttf')
    };
    
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
    this._drawPage1(doc, data);
    doc.addPage();
    this._drawWarranty(doc, data);
    this._drawTerms(doc, data);
    this._drawSignature(doc, data);
    this._drawFooter(doc, data);
  }

  _generatePreAssessment(doc, data) {
    this._drawPage1(doc, data);
    doc.addPage();
    this._drawAssessment(doc, data);
    this._drawIoTSummary(doc, data);
    this._drawPerformance(doc, data);
    this._drawRecommendations(doc, data);
    doc.addPage();
    this._drawWarranty(doc, data);
    this._drawTerms(doc, data);
    this._drawSignature(doc, data);
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
    const centerX = doc.page.width / 2;
    
    if (data.logo) {
      try {
        doc.image(data.logo, leftX, y, { width: 80 });
      } catch (e) {
        // Logo optional
      }
    }
    
    y += 20;
    
    doc.font('Roboto-Bold')
      .fontSize(14)
      .text('SALFER ENGINEERING', leftX, y, { width: 300 });
    
    y += 18;
    doc.font('Roboto')
      .fontSize(10)
      .text('AND SOLAR TECHNOLOGY ENTERPRISE', leftX, y, { width: 300 });
    
    y += 15;
    doc.fontSize(9)
      .text(data.companyAddress || 'Address Line', leftX, y, { width: 300 });
    
    y += 12;
    doc.text(data.companyPhone || 'Phone Number', leftX, y, { width: 300 });
    
    y += 12;
    doc.text(data.companyEmail || 'Email Address', leftX, y, { width: 300 });
    
    doc.font('Roboto-Bold')
      .fontSize(16)
      .text('QUOTATION', centerX, this.margins.top + 30, { align: 'center' });
    
    doc.font('Roboto')
      .fontSize(9)
      .text(`Quotation No: ${data.quotationNumber || 'N/A'}`, rightX - 150, this.margins.top + 20, { align: 'right' });
    
    doc.text(`Date: ${data.date || new Date().toLocaleDateString()}`, rightX - 150, this.margins.top + 35, { align: 'right' });
    
    doc.text(`Validity: ${data.validity || '30 days'}`, rightX - 150, this.margins.top + 50, { align: 'right' });
    
    doc.moveTo(leftX, y + 20)
      .lineTo(rightX, y + 20)
      .stroke();
    
    return y + 30;
  }

  _drawClientInfo(doc, data, y) {
    const leftX = this.margins.left;
    const rightX = doc.page.width - this.margins.right;
    
    doc.font('Roboto-Bold')
      .fontSize(10)
      .text('To:', leftX, y);
    
    y += 15;
    doc.font('Roboto')
      .fontSize(9)
      .text(data.clientName || 'Client Name', leftX, y);
    
    y += 12;
    doc.text(data.clientAddress || 'Client Address', leftX, y);
    
    y += 12;
    doc.text(`Contact Number: ${data.clientPhone || 'N/A'}`, leftX, y);
    
    y += 12;
    doc.text(`Email: ${data.clientEmail || 'N/A'}`, leftX, y);
    
    y += 12;
    doc.text(`Property Type: ${data.propertyType || 'N/A'}`, leftX, y);
    
    y += 12;
    doc.text(`System Type: ${data.systemType || 'N/A'}`, leftX, y);
    
    y += 12;
    doc.text(`Capacity: ${data.capacity || 'N/A'}`, leftX, y);
    
    y += 20;
    doc.moveTo(leftX, y)
      .lineTo(rightX, y)
      .stroke();
    
    return y + 15;
  }

  _drawEquipmentTable(doc, data, y) {
    const leftX = this.margins.left;
    const rightX = doc.page.width - this.margins.right;
    const tableWidth = rightX - leftX;
    const colWidths = {
      item: tableWidth * 0.05,
      description: tableWidth * 0.40,
      qty: tableWidth * 0.10,
      unit: tableWidth * 0.10,
      unitPrice: tableWidth * 0.15,
      amount: tableWidth * 0.20
    };
    
    const categories = this._groupItemsByCategory(data.equipmentDetails || []);
    
    doc.font('Roboto-Bold')
      .fontSize(9);
    
    let headerY = y;
    doc.rect(leftX, headerY, tableWidth, 20)
      .fill(this.colors.tableHeader)
      .stroke(this.colors.border);
    
    doc.fillColor(this.colors.black);
    doc.text('ITEM', leftX + 2, headerY + 4, { width: colWidths.item, align: 'left' });
    doc.text('DESCRIPTION', leftX + colWidths.item + 2, headerY + 4, { width: colWidths.description, align: 'left' });
    doc.text('QTY', leftX + colWidths.item + colWidths.description + 2, headerY + 4, { width: colWidths.qty, align: 'center' });
    doc.text('UNIT', leftX + colWidths.item + colWidths.description + colWidths.qty + 2, headerY + 4, { width: colWidths.unit, align: 'center' });
    doc.text('Unit Price', leftX + colWidths.item + colWidths.description + colWidths.qty + colWidths.unit + 2, headerY + 4, { width: colWidths.unitPrice, align: 'right' });
    doc.text('Amount', leftX + tableWidth - colWidths.amount + 2, headerY + 4, { width: colWidths.amount - 4, align: 'right' });
    
    y += 20;
    let rowY = y;
    
    for (const category of categories) {
      if (rowY > doc.page.height - this.margins.bottom - 100) {
        doc.addPage();
        rowY = this.margins.top;
        this._drawTableHeader(doc, leftX, tableWidth, colWidths, rowY);
        rowY += 20;
      }
      
      doc.font('Roboto-Bold')
        .fontSize(9)
        .text(category.name, leftX + 2, rowY + 2, { width: tableWidth - 4 });
      
      rowY += 15;
      
      for (const item of category.items) {
        if (rowY > doc.page.height - this.margins.bottom - 100) {
          doc.addPage();
          rowY = this.margins.top;
          this._drawTableHeader(doc, leftX, tableWidth, colWidths, rowY);
          rowY += 20;
        }
        
        doc.font('Roboto')
          .fontSize(8);
        
        const itemText = `${item.itemNumber || ''}`;
        doc.text(itemText, leftX + 2, rowY + 2, { width: colWidths.item, align: 'left' });
        doc.text(item.description || '', leftX + colWidths.item + 2, rowY + 2, { width: colWidths.description, align: 'left' });
        doc.text((item.qty || '').toString(), leftX + colWidths.item + colWidths.description + 2, rowY + 2, { width: colWidths.qty, align: 'center' });
        doc.text(item.unit || '', leftX + colWidths.item + colWidths.description + colWidths.qty + 2, rowY + 2, { width: colWidths.unit, align: 'center' });
        doc.text(`₱${(item.unitPrice || 0).toFixed(2)}`, leftX + colWidths.item + colWidths.description + colWidths.qty + colWidths.unit + 2, rowY + 2, { width: colWidths.unitPrice, align: 'right' });
        doc.text(`₱${(item.amount || 0).toFixed(2)}`, leftX + tableWidth - colWidths.amount + 2, rowY + 2, { width: colWidths.amount - 4, align: 'right' });
        
        rowY += 15;
        
        doc.moveTo(leftX, rowY)
          .lineTo(rightX, rowY)
          .stroke();
      }
    }
    
    return rowY + 10;
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
    doc.text('Unit Price', leftX + colWidths.item + colWidths.description + colWidths.qty + colWidths.unit + 2, y + 4, { width: colWidths.unitPrice, align: 'right' });
    doc.text('Amount', leftX + tableWidth - colWidths.amount + 2, y + 4, { width: colWidths.amount - 4, align: 'right' });
  }

  _drawPricing(doc, data, y) {
    const leftX = this.margins.left;
    const rightX = doc.page.width - this.margins.right;
    const tableWidth = rightX - leftX;
    const labelWidth = tableWidth * 0.60;
    const valueWidth = tableWidth * 0.40;
    
    y += 10;
    
    doc.font('Roboto-Bold')
      .fontSize(10)
      .text('TOTAL SOLAR PACKAGE COST OPTIONS', leftX, y);
    
    y += 15;
    
    const pricingData = [
      { label: 'Package Price', value: data.packagePrice || 0 },
      { label: 'Less Discount', value: data.discount || 0 },
      { label: 'TOTAL PACKAGE PRICE', value: data.totalPackagePrice || 0 },
      { label: 'Grand Total', value: data.grandTotal || 0 }
    ];
    
    for (const item of pricingData) {
      doc.font('Roboto')
        .fontSize(9)
        .text(item.label, leftX, y, { width: labelWidth });
      
      const isTotal = item.label === 'TOTAL PACKAGE PRICE' || item.label === 'Grand Total';
      
      if (isTotal) {
        const x = leftX + labelWidth;
        doc.rect(x, y - 2, valueWidth, 16)
          .fill(this.colors.totalBackground)
          .stroke(this.colors.border);
        
        doc.fillColor(this.colors.black)
          .font('Roboto-Bold')
          .text(`₱${item.value.toFixed(2)}`, x + 4, y, { width: valueWidth - 8, align: 'right' });
      } else {
        doc.text(`₱${item.value.toFixed(2)}`, leftX + labelWidth, y, { width: valueWidth, align: 'right' });
      }
      
      y += 18;
    }
    
    return y + 10;
  }

  _drawWarranty(doc, data) {
    let y = this.margins.top;
    
    doc.font('Roboto-Bold')
      .fontSize(14)
      .text('WARRANTY', this.margins.left, y);
    
    y += 25;
    
    const warranties = this._generateWarrantyData(data.equipmentDetails || []);
    
    for (const warranty of warranties) {
      doc.font('Roboto-Bold')
        .fontSize(10)
        .text(warranty.title, this.margins.left, y);
      
      y += 15;
      doc.font('Roboto')
        .fontSize(9)
        .text(warranty.description, this.margins.left + 10, y, { width: doc.page.width - this.margins.left - this.margins.right - 20 });
      
      y += 20;
    }
  }

  _drawTerms(doc, data) {
    let y = this.margins.top + 50;
    
    doc.font('Roboto-Bold')
      .fontSize(14)
      .text('TERMS', this.margins.left, y);
    
    y += 25;
    
    const terms = [
      { title: '1 Price', content: data.paymentTerms || 'Payment terms as agreed upon.' },
      { title: '2 Validity', content: 'This quotation is valid for 30 days from the date of issue.' },
      { title: '3 Delivery', content: 'Delivery timeline will be communicated upon confirmation.' },
      { title: '4 Payment', content: data.paymentTerms || 'Payment terms as agreed upon.' },
      { title: '5 Warranty Claim', content: 'All warranty claims must be submitted in writing.' },
      { title: '6 After Sales Support', content: 'Technical support available during business hours.' }
    ];
    
    for (const term of terms) {
      doc.font('Roboto-Bold')
        .fontSize(10)
        .text(term.title, this.margins.left, y);
      
      y += 15;
      doc.font('Roboto')
        .fontSize(9)
        .text(term.content, this.margins.left + 10, y, { width: doc.page.width - this.margins.left - this.margins.right - 20 });
      
      y += 20;
    }
  }

  _drawSignature(doc, data) {
    const leftX = this.margins.left;
    const rightX = doc.page.width - this.margins.right;
    const centerX = doc.page.width / 2;
    let y = doc.page.height - this.margins.bottom - 120;
    
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
      .text(data.companyFooter || 'SALFER ENGINEERING AND SOLAR TECHNOLOGY ENTERPRISE', 
        this.margins.left, y, { 
          width: doc.page.width - this.margins.left - this.margins.right,
          align: 'center' 
        });
  }

  _drawAssessment(doc, data) {
    let y = this.margins.top;
    
    doc.font('Roboto-Bold')
      .fontSize(14)
      .text('SITE ASSESSMENT SUMMARY', this.margins.left, y);
    
    y += 25;
    
    const assessmentData = [
      { label: 'Roof Area', value: data.roofArea || 'N/A' },
      { label: 'Roof Condition', value: data.roofCondition || 'N/A' },
      { label: 'Roof Type', value: data.roofType || 'N/A' },
      { label: 'Shading', value: data.shading || 'N/A' },
      { label: 'Orientation', value: data.orientation || 'N/A' },
      { label: 'Tilt', value: data.tilt || 'N/A' }
    ];
    
    for (const item of assessmentData) {
      doc.font('Roboto-Bold')
        .fontSize(10)
        .text(`${item.label}:`, this.margins.left, y);
      
      doc.font('Roboto')
        .fontSize(9)
        .text(item.value, this.margins.left + 100, y, { 
          width: doc.page.width - this.margins.left - this.margins.right - 110 
        });
      
      y += 18;
    }
  }

  _drawIoTSummary(doc, data) {
    let y = this.margins.top + 120;
    
    doc.font('Roboto-Bold')
      .fontSize(14)
      .text('IoT SUMMARY', this.margins.left, y);
    
    y += 25;
    
    const iotData = [
      { label: 'Average Irradiance', value: data.averageIrradiance || 'N/A' },
      { label: 'Peak Sun Hours', value: data.peakSunHours || 'N/A' },
      { label: 'Temperature', value: data.temperature || 'N/A' },
      { label: 'Humidity', value: data.humidity || 'N/A' }
    ];
    
    for (const item of iotData) {
      doc.font('Roboto-Bold')
        .fontSize(10)
        .text(`${item.label}:`, this.margins.left, y);
      
      doc.font('Roboto')
        .fontSize(9)
        .text(item.value, this.margins.left + 100, y, { 
          width: doc.page.width - this.margins.left - this.margins.right - 110 
        });
      
      y += 18;
    }
  }

  _drawPerformance(doc, data) {
    let y = this.margins.top + 240;
    
    doc.font('Roboto-Bold')
      .fontSize(14)
      .text('PERFORMANCE SUMMARY', this.margins.left, y);
    
    y += 25;
    
    const performanceData = [
      { label: 'Annual Production', value: data.annualProduction || 'N/A' },
      { label: 'CO₂ Offset', value: data.co2Offset || 'N/A' },
      { label: 'ROI', value: data.roi || 'N/A' },
      { label: 'Monthly Savings', value: data.monthlySavings || 'N/A' },
      { label: 'Site Suitability', value: data.siteSuitability || 'N/A' }
    ];
    
    for (const item of performanceData) {
      doc.font('Roboto-Bold')
        .fontSize(10)
        .text(`${item.label}:`, this.margins.left, y);
      
      doc.font('Roboto')
        .fontSize(9)
        .text(item.value, this.margins.left + 100, y, { 
          width: doc.page.width - this.margins.left - this.margins.right - 110 
        });
      
      y += 18;
    }
  }

  _drawRecommendations(doc, data) {
    let y = this.margins.top + 360;
    
    doc.font('Roboto-Bold')
      .fontSize(14)
      .text('ENGINEER RECOMMENDATIONS', this.margins.left, y);
    
    y += 25;
    
    if (data.recommendations && Array.isArray(data.recommendations)) {
      for (const recommendation of data.recommendations) {
        doc.font('Roboto')
          .fontSize(9)
          .text(`• ${recommendation}`, this.margins.left + 10, y, {
            width: doc.page.width - this.margins.left - this.margins.right - 20
          });
        
        y += 15;
      }
    } else {
      doc.font('Roboto')
        .fontSize(9)
        .text('No recommendations available.', this.margins.left + 10, y);
    }
  }

  _groupItemsByCategory(equipment) {
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
    
    for (const item of equipment) {
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

  _generateWarrantyData(equipment) {
    const warranties = [];
    
    const panelWarranty = equipment.find(item => 
      item.category === 'SOLAR PV MODULES' && item.warranty
    );
    if (panelWarranty) {
      warranties.push({
        title: 'Solar Panel Warranty',
        description: panelWarranty.warranty || '25 years performance warranty'
      });
    }
    
    const inverterWarranty = equipment.find(item => 
      item.category === 'INVERTERS, COMBINERS AND PROTECTION DEVICES' && item.warranty
    );
    if (inverterWarranty) {
      warranties.push({
        title: 'Inverter Warranty',
        description: inverterWarranty.warranty || '5 years standard warranty'
      });
    }
    
    const batteryWarranty = equipment.find(item => 
      item.category === 'BATTERY SYSTEM' && item.warranty
    );
    if (batteryWarranty) {
      warranties.push({
        title: 'Battery Warranty',
        description: batteryWarranty.warranty || '10 years prorated warranty'
      });
    }
    
    warranties.push({
      title: 'Workmanship Warranty',
      description: '5 years workmanship warranty on installation'
    });
    
    return warranties;
  }
}

module.exports = new QuotationGenerator();