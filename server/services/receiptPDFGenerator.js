// services/receiptPDFGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReceiptPDFGenerator {
  constructor() {
    // Font configuration - Helvetica for everything, Roboto for ₱ sign only
    this.fonts = {
      title: 'Helvetica-Bold',
      sectionHeader: 'Helvetica-Bold',
      body: 'Helvetica',
      currency: 'Roboto-Regular',  // Roboto supports ₱ symbol
      tableHeader: 'Helvetica-Bold',
      tableBody: 'Helvetica',
      footer: 'Helvetica-Oblique'
    };

    this.fontSizes = {
      title: 18,
      subtitle: 12,
      sectionHeader: 11,
      body: 9,
      currency: 9,
      tableHeader: 8,
      tableBody: 8,
      footer: 7
    };

    // Page dimensions (A4)
    this.pageWidth = 595.28;
    this.pageHeight = 841.89;
    this.margin = 50;
    this.maxY = this.pageHeight - this.margin;
    this.minY = this.margin;

    // Colors — shared document theme (same as Reports & Quotations)
    this.colors = {
      primary: '#123047',
      secondary: '#2c6e2c',
      accent: '#1B6CA8',
      text: '#333333',
      headerBg: '#1B6CA8',
      headerText: '#FFFFFF',
      bandBg: '#EAF4FB',
      border: '#C8D6E0',
      muted: '#5E6B75',
      lightBg: '#f8f9fa'
    };

    this.companyDefaults = {
      name: 'Salfer Engineering',
      tagline: 'Solar Technology Enterprise',
      address: 'San Nicolas St. Bunsuran 3rd, Pandi, Bulacan',
      contact: 'Tel: 0917XXXXXXX | Email: info@salferengineering.com'
    };
  }

  formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateOnly(date) {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatTimeOnly(date) {
    const d = date instanceof Date ? date : new Date(date || Date.now());
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  }

  logoPath() {
    // receiptPDFGenerator lives in services/, assets are at server/assets
    const candidates = [
      path.join(__dirname, '..', 'assets', 'logo.png'),
      path.join(__dirname, '..', 'assets', 'company_logo.png')
    ];
    for (const p of candidates) {
      try { if (fs.existsSync(p)) return p; } catch (e) { /* ignore */ }
    }
    return null;
  }

  companyOf(receiptData) {
    const info = receiptData?.companyInfo || {};
    return {
      name: info.name || this.companyDefaults.name,
      tagline: this.companyDefaults.tagline,
      address: info.address || this.companyDefaults.address,
      contact: info.contact && info.email
        ? `Tel: ${info.contact} | Email: ${info.email}`
        : (info.contact || this.companyDefaults.contact)
    };
  }

  // Keep content inside the printable area; new pages repeat a compact brand mark.
  ensureSpace(doc, y, needed) {
    if (y + needed > this.maxY - 40) {
      doc.addPage();
      return this.drawContinuationMark(doc);
    }
    return y;
  }

  drawContinuationMark(doc) {
    const logo = this.logoPath();
    if (logo) {
      try { doc.image(logo, this.margin, 22, { fit: [96, 26] }); } catch (e) { /* logo optional */ }
    }
    doc.font(this.fonts.body).fontSize(8).fillColor(this.colors.muted);
    doc.text(this.companyDefaults.name, this.margin + 104, 28);
    doc.strokeColor(this.colors.border).lineWidth(0.5);
    doc.moveTo(this.margin, 56).lineTo(this.pageWidth - this.margin, 56).stroke();
    return 70;
  }

  drawHeader(doc, receiptNumber, paymentDate, receiptData = {}) {
    // Standardized brand header — same visual language as Reports & Quotations.
    // [Logo] Company block, blue divider, centered title + scannable metadata.
    const company = this.companyOf(receiptData);
    const logoSize = 52;
    const logoGap = 12;
    const topY = this.minY + 6;

    let brandX = this.margin;
    const logo = this.logoPath();
    if (logo) {
      try {
        doc.image(logo, this.margin, topY, { fit: [logoSize, logoSize] });
        brandX = this.margin + logoSize + logoGap;
      } catch (e) { /* logo optional */ }
    }
    const brandWidth = (this.pageWidth - this.margin) - brandX;

    doc.font(this.fonts.title).fontSize(17).fillColor(this.colors.primary);
    doc.text(company.name, brandX, topY + 2, { width: brandWidth, align: 'left' });
    doc.font(this.fonts.body).fontSize(8).fillColor(this.colors.muted);
    doc.text(company.address, brandX, topY + 23, { width: brandWidth, align: 'left' });
    doc.font(this.fonts.body).fontSize(8).fillColor(this.colors.accent);
    doc.text(company.tagline, brandX, topY + 35, { width: brandWidth, align: 'left' });

    // Brand divider
    doc.strokeColor(this.colors.accent).lineWidth(2);
    doc.moveTo(this.margin, topY + 58).lineTo(this.pageWidth - this.margin, topY + 58).stroke();

    // Receipt title + metadata (centered hierarchy, wraps safely)
    const titleY = topY + 68;
    doc.font(this.fonts.title).fontSize(17).fillColor(this.colors.primary);
    doc.text('OFFICIAL RECEIPT', this.margin, titleY, {
      width: this.pageWidth - this.margin * 2, align: 'center'
    });

    const issuedBy = receiptData.verifiedByName || receiptData.generatedBy || 'Administrator';
    const metaLines = [
      `Receipt No: ${receiptNumber || 'N/A'}   •   Transaction Date: ${this.formatDateOnly(paymentDate)}`,
      `Generated/Issued by: ${issuedBy}   •   Generated time: ${this.formatTimeOnly(receiptData.generatedAt || paymentDate)}`
    ];
    let metaY = doc.y + 4;
    doc.font(this.fonts.body).fontSize(8.5).fillColor(this.colors.muted);
    for (const line of metaLines) {
      doc.text(line, this.margin, metaY, { width: this.pageWidth - this.margin * 2, align: 'center' });
      metaY = doc.y;
    }

    doc.strokeColor(this.colors.border).lineWidth(0.5);
    doc.moveTo(this.margin, metaY + 8).lineTo(this.pageWidth - this.margin, metaY + 8).stroke();

    return metaY + 16;
  }

  drawCustomerInfo(doc, y, customer) {
    customer = customer || {};
    doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.sectionHeader).fillColor(this.colors.primary);
    doc.text('CUSTOMER INFORMATION', this.margin, y);
    let currentY = y + 18;

    const rows = [
      { label: 'NAME', value: customer.name || 'N/A' },
      ...(customer.address ? [{ label: 'ADDRESS', value: customer.address }] : []),
      ...(customer.contact ? [{ label: 'CONTACT', value: customer.contact }] : []),
      ...(customer.email ? [{ label: 'EMAIL', value: customer.email }] : [])
    ];

    const pad = 10;
    const labelW = 72;
    const valueX = this.margin + pad + labelW;
    const valueW = (this.pageWidth - this.margin) - valueX - pad;

    doc.font(this.fonts.body).fontSize(this.fontSizes.body);
    let contentH = 0;
    const heights = rows.map(r => {
      const h = Math.max(14, doc.heightOfString(String(r.value ?? 'N/A'), { width: valueW }));
      contentH += h + 4;
      return h;
    });
    const cardH = contentH + pad * 2;
    currentY = this.ensureSpace(doc, currentY, Math.min(cardH, 160));
    const cardY = currentY;

    doc.save();
    doc.fillColor(this.colors.bandBg).rect(this.margin, cardY, this.pageWidth - this.margin * 2, cardH).fill();
    doc.strokeColor(this.colors.border).lineWidth(0.5).rect(this.margin, cardY, this.pageWidth - this.margin * 2, cardH).stroke();
    doc.restore();

    let rowY = cardY + pad;
    rows.forEach((r, i) => {
      doc.font(this.fonts.body).fontSize(8).fillColor(this.colors.muted);
      doc.text(r.label, this.margin + pad, rowY, { width: labelW });
      doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
      doc.text(String(r.value ?? 'N/A'), valueX, rowY, { width: valueW });
      rowY += heights[i] + 4;
    });

    return cardY + cardH + 14;
  }

  drawPaymentDetails(doc, y, paymentData) {
    doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.sectionHeader).fillColor(this.colors.primary);
    doc.text('PAYMENT DETAILS', this.margin, y);

    let currentY = y + 18;
    const labelX = this.margin + 25;
    const valueX = this.margin + 130;
    const valueW = (this.pageWidth - this.margin) - valueX - 15;

    // Wrap-aware rows (same values as before — presentation only)
    doc.font(this.fonts.body).fontSize(9);
    const methodH = Math.max(16, doc.heightOfString(String(paymentData.paymentMethod || 'N/A').toUpperCase(), { width: valueW }));
    const refH = paymentData.referenceNumber
      ? Math.max(16, doc.heightOfString(String(paymentData.referenceNumber), { width: valueW }))
      : 0;
    const boxHeight = 10 + 20 + 25 + (methodH + 4) + (refH ? refH + 4 : 0) + 10;

    currentY = this.ensureSpace(doc, currentY, Math.min(boxHeight, 200));
    const boxY = currentY;
    const boxW = this.pageWidth - (this.margin * 2) - 20;
    doc.save();
    doc.fillColor(this.colors.lightBg).rect(this.margin + 10, boxY, boxW, boxHeight).fill();
    doc.strokeColor(this.colors.border).lineWidth(0.5).rect(this.margin + 10, boxY, boxW, boxHeight).stroke();
    doc.restore();

    let innerY = boxY + 10;

    doc.font(this.fonts.tableHeader).fontSize(9).fillColor(this.colors.primary);
    doc.text('Payment Type:', labelX, innerY);
    doc.font(this.fonts.body).fillColor(this.colors.text);
    doc.text(this.getPaymentTypeLabel(paymentData.paymentType), valueX, innerY, { width: valueW });
    innerY += 20;

    doc.font(this.fonts.tableHeader).fontSize(9).fillColor(this.colors.primary);
    doc.text('Amount Paid:', labelX, innerY);

    // Use Roboto font for currency (supports ₱)
    const amountValue = paymentData.amount;
    doc.font(this.fonts.currency).fontSize(14).fillColor(this.colors.secondary);
    doc.text(`₱ ${amountValue}`, valueX, innerY - 3, { width: valueW });

    innerY += 25;

    doc.font(this.fonts.tableHeader).fontSize(9).fillColor(this.colors.primary);
    doc.text('Payment Method:', labelX, innerY);
    doc.font(this.fonts.body).fillColor(this.colors.text);
    doc.text(String(paymentData.paymentMethod || 'N/A').toUpperCase(), valueX, innerY, { width: valueW });
    innerY += methodH + 4;

    if (paymentData.referenceNumber) {
      doc.font(this.fonts.tableHeader).fontSize(9).fillColor(this.colors.primary);
      doc.text('Reference No:', labelX, innerY);
      doc.font(this.fonts.body).fillColor(this.colors.text);
      doc.text(String(paymentData.referenceNumber), valueX, innerY, { width: valueW });
      innerY += refH + 4;
    }

    return boxY + boxHeight + 14;
  }

  drawTransactionDetails(doc, y, paymentData) {
    doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.sectionHeader).fillColor(this.colors.primary);
    doc.text('TRANSACTION DETAILS', this.margin, y);

    let currentY = y + 18;

    const columns = [
      { label: 'Description', width: 160, align: 'left' },
      { label: 'Invoice/Reference', width: 100, align: 'left' },
      { label: 'Amount', width: 90, align: 'right' }
    ];

    currentY = this.drawTableHeader(doc, currentY, columns);

    const description = this.getTransactionDescription(paymentData);
    const reference = paymentData.invoiceNumber || paymentData.referenceNumber || 'N/A';

    currentY = this.drawTableRow(doc, currentY, columns, [
      description,
      reference,
      `₱ ${paymentData.amount}`
    ], true);

    return currentY + 15;
  }

  drawBreakdown(doc, y, paymentData) {
    doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.sectionHeader).fillColor(this.colors.primary);
    doc.text('BREAKDOWN', this.margin, y);

    let currentY = y + 18;

    const columns = [
      { label: 'Item', width: 260, align: 'left' },
      { label: 'Amount', width: 90, align: 'right' }
    ];

    currentY = this.drawTableHeader(doc, currentY, columns);

    const items = this.getBreakdownItems(paymentData);

    items.forEach((item, index) => {
      currentY = this.drawTableRow(doc, currentY, columns, [item.name, `₱ ${item.amount}`], index === items.length - 1);
    });

    // Total band - aligned with table columns (same value as before)
    currentY += 8;
    currentY = this.ensureSpace(doc, currentY, 30);

    const tableW = this.pageWidth - (this.margin * 2);
    const amountColumnX = this.margin + 260; // Same as Item column width
    const amountColumnWidth = 90;

    doc.save();
    doc.fillColor(this.colors.primary).rect(this.margin, currentY - 4, tableW, 22).fill();
    doc.restore();

    doc.font(this.fonts.title).fontSize(11).fillColor('#FFFFFF');
    doc.text('TOTAL', this.margin + 8, currentY);

    doc.font(this.fonts.currency).fontSize(11).fillColor('#FFFFFF');
    doc.text(`₱ ${paymentData.amount.toLocaleString()}`, amountColumnX, currentY, {
      width: amountColumnWidth,
      align: 'right'
    });

    return currentY + 26;
  }

  drawVerificationInfo(doc, y, paymentData) {
    const issuedBy = paymentData.verifiedByName || paymentData.verifiedBy;
    if (!issuedBy && !paymentData.notes) return y;

    y = this.ensureSpace(doc, y, 40);
    doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.sectionHeader).fillColor(this.colors.primary);
    doc.text('VERIFICATION', this.margin, y);

    let currentY = y + 18;
    const textW = this.pageWidth - (this.margin * 2) - 20;

    if (issuedBy) {
      const byLine = `Verified by: ${issuedBy}`;
      const onLine = `Verified on: ${this.formatDate(paymentData.verifiedAt || new Date())}`;
      doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
      const byH = Math.max(14, doc.heightOfString(byLine, { width: textW }));
      currentY = this.ensureSpace(doc, currentY, byH + 20);
      doc.text(byLine, this.margin + 10, currentY, { width: textW });
      currentY += byH + 2;
      doc.text(onLine, this.margin + 10, currentY, { width: textW });
      currentY += 18;
    }

    if (paymentData.notes) {
      doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
      const notesH = Math.max(14, doc.heightOfString(`Notes: ${paymentData.notes}`, { width: textW }));
      currentY = this.ensureSpace(doc, currentY, Math.min(notesH + 6, 200));
      doc.text(`Notes: ${paymentData.notes}`, this.margin + 10, currentY, { width: textW });
      currentY += notesH + 6;
    }

    return currentY;
  }

  drawFooter(doc, receiptData = {}) {
    const footerY = this.maxY - 28;

    // Divider line
    doc.strokeColor(this.colors.border).lineWidth(0.5);
    doc.moveTo(this.margin, footerY - 15).lineTo(this.pageWidth - this.margin, footerY - 15).stroke();

    doc.font(this.fonts.footer).fontSize(this.fontSizes.footer).fillColor(this.colors.muted);
    doc.text('Thank you for choosing Salfer Engineering!', this.margin, footerY, { align: 'center', width: this.pageWidth - (this.margin * 2) });

    const infoLine = receiptData.receiptNumber
      ? `${this.companyDefaults.name}  •  Receipt ${receiptData.receiptNumber}`
      : this.companyDefaults.name;
    doc.font(this.fonts.body).fontSize(7).fillColor(this.colors.muted);
    doc.text(infoLine, this.margin, footerY + 11, { align: 'center', width: this.pageWidth - (this.margin * 2) });
  }

  drawTableHeader(doc, y, columns) {
    const tableX = this.margin;
    const tableWidth = this.pageWidth - (this.margin * 2);

    y = this.ensureSpace(doc, y, 56);
    doc.save();
    doc.fillColor(this.colors.headerBg).rect(tableX, y - 8, tableWidth, 20).fill();
    doc.restore();
    doc.font(this.fonts.tableHeader).fontSize(this.fontSizes.tableHeader).fillColor(this.colors.headerText);

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

    doc.strokeColor(this.colors.border).lineWidth(0.5);
    doc.moveTo(tableX, y - 8).lineTo(tableX + tableWidth, y - 8).stroke();
    doc.moveTo(tableX, y + 12).lineTo(tableX + tableWidth, y + 12).stroke();

    return y + 18;
  }

  drawTableRow(doc, y, columns, values, isLastRow = false) {
    const tableX = this.margin;
    const tableWidth = this.pageWidth - (this.margin * 2);

    // Measure wrapped height so long descriptions never clip or overlap.
    let rowH = 18;
    columns.forEach((col, index) => {
      const value = String(values[index] || '');
      const isCurrency = col.label === 'Amount' && value.includes('₱');
      doc.font(isCurrency ? this.fonts.currency : this.fonts.tableBody).fontSize(this.fontSizes.tableBody);
      rowH = Math.max(rowH, doc.heightOfString(value, { width: col.width - 10 }) + 6);
    });

    y = this.ensureSpace(doc, y, rowH + 4);

    let currentX = tableX;
    columns.forEach((col, index) => {
      const value = String(values[index] || '');
      const align = col.align || 'left';

      // Use Roboto font for Amount column (supports ₱)
      if (col.label === 'Amount' && value.includes('₱')) {
        doc.font(this.fonts.currency).fontSize(this.fontSizes.tableBody);
      } else {
        doc.font(this.fonts.tableBody).fontSize(this.fontSizes.tableBody);
      }

      doc.fillColor(this.colors.text);
      doc.text(value, currentX + (align === 'right' ? col.width - 5 : 5), y, {
        width: col.width - 10,
        align: align
      });
      currentX += col.width;
    });

    doc.strokeColor(this.colors.border).lineWidth(0.5);
    doc.moveTo(tableX, y + rowH - 2).lineTo(tableX + tableWidth, y + rowH - 2).stroke();

    return y + rowH;
  }

  getPaymentTypeLabel(type) {
    const labels = {
      'pre_assessment': 'Pre-Assessment Fee',
      'initial': 'Initial Payment (30%)',
      'progress': 'Progress Payment (40%)',
      'final': 'Final Payment (30%)',
      'full': 'Full Payment (100%)',
      'additional': 'Additional Work'
    };
    return labels[type] || type;
  }

  getTransactionDescription(paymentData) {
    if (paymentData.paymentType === 'pre_assessment') {
      return 'Pre-Assessment Service Fee';
    }
    if (paymentData.projectName) {
      return `${paymentData.paymentType.toUpperCase()} Payment - ${paymentData.projectName}`;
    }
    return `${paymentData.paymentType.toUpperCase()} Payment`;
  }

  getBreakdownItems(paymentData) {
    const items = [];

    if (paymentData.paymentType === 'pre_assessment') {
      items.push({ name: 'Pre-Assessment Service Fee', amount: paymentData.amount });
    } else if (paymentData.paymentType === 'initial') {
      items.push({ name: 'Initial Deposit (30% of total project cost)', amount: paymentData.amount });
    } else if (paymentData.paymentType === 'progress') {
      items.push({ name: 'Progress Payment (40% of total project cost)', amount: paymentData.amount });
    } else if (paymentData.paymentType === 'final') {
      items.push({ name: 'Final Payment (30% of total project cost)', amount: paymentData.amount });
    } else if (paymentData.paymentType === 'full') {
      items.push({ name: 'Full Payment (100% of total project cost)', amount: paymentData.amount });
    }

    return items;
  }

  async generateReceiptPDF(receiptData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: this.margin,
          size: 'A4',
          autoFirstPage: true,
          bufferPages: true
        });

        // Register Roboto fonts
        const fontsPath = path.join(__dirname, '../fonts');

        try {
          if (fs.existsSync(path.join(fontsPath, 'Roboto-Regular.ttf'))) {
            doc.registerFont('Roboto-Regular', path.join(fontsPath, 'Roboto-Regular.ttf'));
            console.log('✓ Roboto font registered for ₱ symbol');
          } else {
            // Fallback to Courier if Roboto not found
            this.fonts.currency = 'Courier';
            console.log('⚠ Roboto not found, using Courier for ₱ symbol');
          }
        } catch (e) {
          this.fonts.currency = 'Courier';
          console.log('⚠ Roboto registration failed, using Courier for ₱ symbol');
        }

        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Draw all content (with overflow-safe pagination)
        let y = this.drawHeader(doc, receiptData.receiptNumber, receiptData.paymentDate, receiptData);
        y = this.drawCustomerInfo(doc, y, receiptData.customer);
        y = this.drawPaymentDetails(doc, y, receiptData);
        y = this.drawTransactionDetails(doc, y, receiptData);
        y = this.drawBreakdown(doc, y, receiptData);
        y = this.drawVerificationInfo(doc, y, receiptData);
        this.drawFooter(doc, receiptData);

        // Finalize the document
        doc.end();

      } catch (error) {
        console.error('PDF Generation Error:', error);
        reject(error);
      }
    });
  }
}

module.exports = new ReceiptPDFGenerator();