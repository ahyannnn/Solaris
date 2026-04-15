// services/receiptService.js - Updated
const cloudinary = require('cloudinary').v2;
const receiptPDFGenerator = require('./receiptPDFGenerator');
const Receipt = require('../models/Receipt');

class ReceiptService {
  constructor() {
    this.companyInfo = {
      name: 'Salfer Engineering',
      address: 'Purok 2, Masaya, San Jose, Camarines Sur',
      contact: '0917XXXXXXX',
      email: 'info@salferengineering.com',
      tin: '123-456-789-000'
    };
  }

  generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RCP-${year}${month}${day}-${hour}${minute}-${random}`;
  }

  async generateReceipt(paymentData) {
    try {
      const receiptNumber = paymentData.receiptNumber || this.generateReceiptNumber();
      
      const receiptData = {
        receiptNumber,
        companyInfo: this.companyInfo,
        paymentDate: paymentData.paymentDate || new Date(),
        customer: {
          name: paymentData.customer.name,
          address: paymentData.customer.address,
          contact: paymentData.customer.contact,
          email: paymentData.customer.email
        },
        paymentType: paymentData.paymentType,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        invoiceNumber: paymentData.invoiceNumber,
        projectName: paymentData.projectName,
        verifiedBy: paymentData.verifiedBy,
        verifiedAt: paymentData.verifiedAt,
        notes: paymentData.notes
      };

      // Generate PDF using the receipt generator
      const pdfBuffer = await receiptPDFGenerator.generateReceiptPDF(receiptData);
      
      // Upload to Cloudinary
      const result = await this.uploadToCloudinary(pdfBuffer, receiptNumber);
      
      // Save to database
      const receiptRecord = await this.saveReceiptToDatabase(receiptData, result);
      
      return {
        success: true,
        receiptUrl: result.secure_url,
        receiptNumber: receiptNumber,
        receiptId: receiptRecord._id,
        pdfBuffer: pdfBuffer // Optional: return buffer for immediate download
      };
    } catch (error) {
      console.error('Receipt generation error:', error);
      throw error;
    }
  }

  async uploadToCloudinary(pdfBuffer, receiptNumber) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'receipts',
          public_id: receiptNumber,
          format: 'pdf',
          access_mode: 'public'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(pdfBuffer);
    });
  }

  async saveReceiptToDatabase(data, cloudinaryResult) {
    const receipt = new Receipt({
      receiptNumber: data.receiptNumber,
      paymentType: data.paymentType,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      paymentDate: data.paymentDate,
      customerName: data.customer.name,
      customerAddress: data.customer.address,
      customerContact: data.customer.contact,
      customerEmail: data.customer.email,
      invoiceNumber: data.invoiceNumber,
      projectName: data.projectName,
      receiptUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      verifiedBy: data.verifiedBy,
      verifiedAt: data.verifiedAt,
      notes: data.notes
    });
    await receipt.save();
    return receipt;
  }
}

module.exports = new ReceiptService();