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

    // Colors
    this.colors = {
      primary: '#1a3a5c',
      secondary: '#2c6e2c',
      accent: '#f39c12',
      text: '#333333',
      headerBg: '#e8f0f8',
      border: '#cccccc',
      lightBg: '#f8f9fa'
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

  drawHeader(doc, receiptNumber, paymentDate) {
    // Left side - Company logo area
    doc.font(this.fonts.title).fontSize(this.fontSizes.title).fillColor(this.colors.primary);
    doc.text('SALFER ENGINEERING', this.margin, this.minY + 10);
    doc.font(this.fonts.body).fontSize(this.fontSizes.subtitle).fillColor('#4a627a');
    doc.text('Solar Technology Enterprise', this.margin, this.minY + 32);
    doc.fontSize(this.fontSizes.body).fillColor('#666666');
    doc.text('DTI Registered', this.margin, this.minY + 48);
    doc.text('San Nicolas St. Bunsuran 3rd, Pandi, Bulacan', this.margin, this.minY + 62);
    doc.text('Tel: 0917XXXXXXX | Email: info@salferengineering.com', this.margin, this.minY + 76);
    doc.text(`Receipt No: ${receiptNumber}`, this.margin, this.minY + 76 + 14);

    // Right side - Official Receipt title (single line)
    const rightX = this.pageWidth - this.margin - 140;
    doc.font(this.fonts.title).fontSize(14).fillColor(this.colors.accent);
    doc.text('OFFICIAL RECEIPT', rightX, this.minY + 30, { width: 140, align: 'center' });

    doc.font(this.fonts.body).fontSize(9).fillColor('#666666');
    doc.text(`Date: ${this.formatDate(paymentDate)}`, rightX, this.minY + 55, { width: 140, align: 'center' });

    // Divider line
    doc.strokeColor(this.colors.accent).lineWidth(1.5);
    doc.moveTo(this.margin, this.minY + 100).lineTo(this.pageWidth - this.margin, this.minY + 100).stroke();

    return this.minY + 115;
  }

  drawCustomerInfo(doc, y, customer) {
    doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.sectionHeader).fillColor(this.colors.primary);
    doc.text('CUSTOMER INFORMATION', this.margin, y);

    doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
    let currentY = y + 18;

    doc.text(`Name: ${customer.name || 'N/A'}`, this.margin + 10, currentY);
    currentY += 16;

    if (customer.address) {
      doc.text(`Address: ${customer.address}`, this.margin + 10, currentY);
      currentY += 16;
    }

    if (customer.contact) {
      doc.text(`Contact: ${customer.contact}`, this.margin + 10, currentY);
      currentY += 16;
    }

    if (customer.email) {
      doc.text(`Email: ${customer.email}`, this.margin + 10, currentY);
      currentY += 16;
    }

    // Divider line
    doc.strokeColor(this.colors.border).lineWidth(0.5);
    doc.moveTo(this.margin, currentY + 5).lineTo(this.pageWidth - this.margin, currentY + 5).stroke();

    return currentY + 20;
  }

  drawPaymentDetails(doc, y, paymentData) {
    doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.sectionHeader).fillColor(this.colors.primary);
    doc.text('PAYMENT DETAILS', this.margin, y);

    let currentY = y + 18;

    // Payment summary box
    const boxHeight = 80;
    doc.rect(this.margin + 10, currentY, this.pageWidth - (this.margin * 2) - 20, boxHeight)
      .fill(this.colors.lightBg);

    let innerY = currentY + 10;

    doc.font(this.fonts.tableHeader).fontSize(9).fillColor(this.colors.primary);
    doc.text('Payment Type:', this.margin + 25, innerY);
    doc.font(this.fonts.body).fillColor(this.colors.text);
    doc.text(this.getPaymentTypeLabel(paymentData.paymentType), this.margin + 130, innerY);
    innerY += 20;

    doc.font(this.fonts.tableHeader).fontSize(9).fillColor(this.colors.primary);
    doc.text('Amount Paid:', this.margin + 25, innerY);

    // Split amount into number only, then use Roboto for ₱ and number
    const amountValue = paymentData.amount;
    // Use Roboto font for currency (supports ₱)
    doc.font(this.fonts.currency).fontSize(14).fillColor(this.colors.secondary);
    doc.text(`₱ ${amountValue}`, this.margin + 130, innerY - 3);

    innerY += 25;

    doc.font(this.fonts.tableHeader).fontSize(9).fillColor(this.colors.primary);
    doc.text('Payment Method:', this.margin + 25, innerY);
    doc.font(this.fonts.body).fillColor(this.colors.text);
    doc.text(paymentData.paymentMethod.toUpperCase(), this.margin + 130, innerY);
    innerY += 20;

    if (paymentData.referenceNumber) {
      doc.font(this.fonts.tableHeader).fontSize(9).fillColor(this.colors.primary);
      doc.text('Reference No:', this.margin + 25, innerY);
      doc.font(this.fonts.body).fillColor(this.colors.text);
      doc.text(paymentData.referenceNumber, this.margin + 130, innerY);
      innerY += 20;
    }

    return innerY + 15;
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

    // Total - aligned with table columns
    currentY += 8;

    const amountColumnX = this.margin + 260; // Same as Item column width
    const amountColumnWidth = 90;

    doc.font(this.fonts.title).fontSize(11).fillColor(this.colors.secondary);
    doc.text('TOTAL', this.margin + 5, currentY);

    doc.font(this.fonts.currency).fontSize(11).fillColor(this.colors.secondary);
    // Use a smaller font size if still breaking
    doc.text(`₱ ${paymentData.amount.toLocaleString()}`, amountColumnX, currentY, {
      width: amountColumnWidth,
      align: 'right'
    });

    return currentY + 25;
  }

  drawVerificationInfo(doc, y, paymentData) {
    if (!paymentData.verifiedBy && !paymentData.notes) return y;

    doc.font(this.fonts.sectionHeader).fontSize(this.fontSizes.sectionHeader).fillColor(this.colors.primary);
    doc.text('VERIFICATION', this.margin, y);

    let currentY = y + 18;

    if (paymentData.verifiedBy) {
      doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
      doc.text(`Verified by: ${paymentData.verifiedBy}`, this.margin + 10, currentY);
      currentY += 16;
      doc.text(`Verified on: ${this.formatDate(paymentData.verifiedAt || new Date())}`, this.margin + 10, currentY);
      currentY += 20;
    }

    if (paymentData.notes) {
      doc.font(this.fonts.body).fontSize(this.fontSizes.body).fillColor(this.colors.text);
      doc.text(`Notes: ${paymentData.notes}`, this.margin + 10, currentY, {
        width: this.pageWidth - (this.margin * 2) - 20
      });
      currentY += 20;
    }

    return currentY;
  }

  drawFooter(doc) {
    const footerY = this.maxY - 20;

    // Divider line
    doc.strokeColor(this.colors.border).lineWidth(0.5);
    doc.moveTo(this.margin, footerY - 15).lineTo(this.pageWidth - this.margin, footerY - 15).stroke();

    doc.font(this.fonts.footer).fontSize(this.fontSizes.footer).fillColor('#888888');
    doc.text('Thank you for choosing Salfer Engineering!', this.margin, footerY, { align: 'center', width: this.pageWidth - (this.margin * 2) });

  }

  drawTableHeader(doc, y, columns) {
    const tableX = this.margin;
    const tableWidth = this.pageWidth - (this.margin * 2);

    doc.rect(tableX, y - 8, tableWidth, 20).fill(this.colors.headerBg);
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

    doc.strokeColor(this.colors.border).lineWidth(0.5);
    doc.moveTo(tableX, y - 8).lineTo(tableX + tableWidth, y - 8).stroke();
    doc.moveTo(tableX, y + 12).lineTo(tableX + tableWidth, y + 12).stroke();

    return y + 18;
  }

  drawTableRow(doc, y, columns, values, isLastRow = false) {
    const tableX = this.margin;
    const tableWidth = this.pageWidth - (this.margin * 2);

    let currentX = tableX;
    columns.forEach((col, index) => {
      let value = values[index] || '';
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

    if (!isLastRow) {
      doc.strokeColor(this.colors.border).lineWidth(0.5);
      doc.moveTo(tableX, y + 16).lineTo(tableX + tableWidth, y + 16).stroke();
    }

    return y + 18;
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

        // Draw all content on page 1 only
        let y = this.drawHeader(doc, receiptData.receiptNumber, receiptData.paymentDate);
        y = this.drawCustomerInfo(doc, y, receiptData.customer);
        y = this.drawPaymentDetails(doc, y, receiptData);
        y = this.drawTransactionDetails(doc, y, receiptData);
        y = this.drawBreakdown(doc, y, receiptData);
        y = this.drawVerificationInfo(doc, y, receiptData);
        this.drawFooter(doc);

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