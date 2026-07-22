// controllers/bankTransferController.js
const BankTransferPayment = require('../models/BankTransferPayment');
const SolarInvoice = require('../models/SolarInvoice');
const Project = require('../models/Project');
const Client = require('../models/Clients');
const User = require('../models/Users');
const receiptService = require('../services/receiptService');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

// Helper: Generate receipt number
const generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RCPT-${year}${month}${day}-${random}`;
};

// Company bank accounts
const companyBanks = [
  { id: 'bpo', name: 'BPO', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
  { id: 'bpi', name: 'BPI', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
  
  { id: 'metrobank', name: 'Metrobank', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
  { id: 'security_bank', name: 'Security Bank', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
  
];

// =============================================
// GET COMPANY BANK ACCOUNTS
// =============================================

// @desc    Get company bank accounts for manual transfer
// @route   GET /api/payments/bank-transfer/banks
// @access  Private (Customer)
const getCompanyBankAccounts = async (req, res) => {
  try {
    res.json({
      success: true,
      banks: companyBanks.map(bank => ({
        id: bank.id,
        name: bank.name,
        accountName: bank.accountName,
        accountNumber: bank.accountNumber
      }))
    });
  } catch (error) {
    console.error('Get company bank accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank accounts',
      error: error.message
    });
  }
};

// =============================================
// CUSTOMER: Submit Manual Bank Transfer Payment
// =============================================

// @desc    Submit manual bank transfer payment
// @route   POST /api/payments/bank-transfer/manual
// @access  Private (Customer)
const submitManualBankTransfer = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      invoiceId,
      bankName,
      accountName,
      transactionReference,
      amount,
      transferDate,
      transferTime,
      remarks
    } = req.body;

    // Validate required fields
    if (!invoiceId || !bankName || !transactionReference || !amount || !transferDate || !transferTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Please provide: invoiceId, bankName, transactionReference, amount, transferDate, transferTime'
      });
    }

    // Validate bank name
    const validBanks = companyBanks.map(b => b.name);
    if (!validBanks.includes(bankName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid bank name. Valid options: ${validBanks.join(', ')}`
      });
    }

    // Check if proof of payment was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Proof of payment is required. Please upload an image or PDF.'
      });
    }

    // Get client
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Get invoice
    const invoice = await SolarInvoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Verify ownership
    if (invoice.clientId.toString() !== client._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if invoice is already paid
    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    // Get project
    const project = await Project.findById(invoice.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if there's already a pending verification for this invoice
    const existingPending = await BankTransferPayment.findOne({
      invoiceId: invoice._id,
      status: 'waiting_verification'
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending verification request for this invoice. Please wait for admin approval.'
      });
    }

    // Upload proof to Cloudinary
    let proofUrl = '';
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `solar-tps/bank-transfer-proofs/${invoice.invoiceNumber}`,
            resource_type: 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
            transformation: [
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        const bufferStream = require('stream').Readable.from(req.file.buffer);
        bufferStream.pipe(uploadStream);
      });

      proofUrl = result.secure_url;
      console.log(`✅ Proof uploaded to Cloudinary: ${proofUrl}`);
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload proof of payment. Please try again.'
      });
    }

    // Create bank transfer payment record
    const bankTransfer = new BankTransferPayment({
      invoiceId: invoice._id,
      projectId: project._id,
      clientId: client._id,
      bankName: bankName,
      accountName: accountName || '',
      transactionReference: transactionReference,
      amount: parseFloat(amount),
      transferDate: new Date(transferDate),
      transferTime: transferTime,
      proofOfPayment: proofUrl,
      remarks: remarks || '',
      status: 'waiting_verification'
    });

    await bankTransfer.save();

    // Update invoice paymentStatus to 'for_verification'
    invoice.paymentStatus = 'for_verification';
    await invoice.save();

    // Log the submission
    console.log(`✅ Manual bank transfer submitted: ${bankTransfer._id} for invoice ${invoice.invoiceNumber}`);

    res.status(201).json({
      success: true,
      message: 'Bank transfer payment submitted successfully. Please wait for admin verification.',
      data: {
        id: bankTransfer._id,
        status: bankTransfer.status,
        invoiceNumber: invoice.invoiceNumber,
        amount: bankTransfer.amount,
        submittedAt: bankTransfer.createdAt
      }
    });

  } catch (error) {
    console.error('Submit manual bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit bank transfer payment',
      error: error.message
    });
  }
};

// =============================================
// ADMIN: Get All Pending Bank Transfers
// =============================================

// @desc    Get all bank transfer submissions with filters
// @route   GET /api/payments/bank-transfer/pending
// @access  Private (Admin only)
const getPendingBankTransfers = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, bank } = req.query;

    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (bank && bank !== 'all') {
      query.bankName = bank;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { transactionReference: searchRegex },
        { bankName: searchRegex },
        { accountName: searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      BankTransferPayment.find(query)
        .populate('invoiceId', 'invoiceNumber invoiceType totalAmount balance paymentStatus')
        .populate('projectId', 'projectName projectReference')
        .populate('clientId', 'contactFirstName contactLastName contactNumber userId')
        .populate('verifiedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BankTransferPayment.countDocuments(query)
    ]);

    // Populate client user email
    const paymentsWithClientEmail = await Promise.all(
      payments.map(async (payment) => {
        const paymentObj = payment.toObject();
        if (payment.clientId && payment.clientId.userId) {
          const user = await User.findById(payment.clientId.userId);
          paymentObj.clientEmail = user?.email || '';
        }
        return paymentObj;
      })
    );

    res.json({
      success: true,
      data: paymentsWithClientEmail,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get pending bank transfers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending bank transfers',
      error: error.message
    });
  }
};

// =============================================
// ADMIN: Get Bank Transfer Statistics
// =============================================

// @desc    Get bank transfer statistics
// @route   GET /api/payments/bank-transfer/stats
// @access  Private (Admin only)
const getBankTransferStats = async (req, res) => {
  try {
    const [total, waiting, verified, rejected, totalAmount, verifiedAmount] = await Promise.all([
      BankTransferPayment.countDocuments(),
      BankTransferPayment.countDocuments({ status: 'waiting_verification' }),
      BankTransferPayment.countDocuments({ status: 'verified' }),
      BankTransferPayment.countDocuments({ status: 'rejected' }),
      BankTransferPayment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      BankTransferPayment.aggregate([
        { $match: { status: 'verified' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Get bank breakdown
    const bankBreakdown = await BankTransferPayment.aggregate([
      { $group: { _id: '$bankName', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await BankTransferPayment.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        waiting_verification: waiting,
        verified,
        rejected,
        totalAmount: totalAmount[0]?.total || 0,
        verifiedAmount: verifiedAmount[0]?.total || 0,
        bankBreakdown,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Get bank transfer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// =============================================
// ADMIN: Get Single Bank Transfer
// =============================================

// @desc    Get a single bank transfer by ID
// @route   GET /api/payments/bank-transfer/:id
// @access  Private (Admin only)
const getBankTransferById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await BankTransferPayment.findById(id)
      .populate('invoiceId', 'invoiceNumber invoiceType totalAmount balance paymentStatus description')
      .populate('projectId', 'projectName projectReference totalCost')
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId')
      .populate('verifiedBy', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Bank transfer payment not found'
      });
    }

    // Get client email
    let clientEmail = '';
    if (payment.clientId && payment.clientId.userId) {
      const user = await User.findById(payment.clientId.userId);
      clientEmail = user?.email || '';
    }

    res.json({
      success: true,
      data: {
        ...payment.toObject(),
        clientEmail
      }
    });

  } catch (error) {
    console.error('Get bank transfer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank transfer',
      error: error.message
    });
  }
};

// =============================================
// ADMIN: Approve Bank Transfer Payment
// =============================================

// @desc    Approve a bank transfer payment
// @route   PUT /api/payments/bank-transfer/:id/approve
// @access  Private (Admin only)
const approveBankTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Find the bank transfer payment
    const bankTransfer = await BankTransferPayment.findById(id)
      .populate('invoiceId')
      .populate('projectId')
      .populate('clientId');

    if (!bankTransfer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Bank transfer payment not found'
      });
    }

    // Check if already processed
    if (bankTransfer.status !== 'waiting_verification') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Payment already ${bankTransfer.status}. Cannot approve again.`
      });
    }

    const invoice = bankTransfer.invoiceId;
    const project = bankTransfer.projectId;
    const client = bankTransfer.clientId;

    // Check if invoice is already paid
    if (invoice.paymentStatus === 'paid') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    // Get client user for email
    const clientUser = await User.findById(client.userId);

    // Prepare payment data
    const paymentAmount = bankTransfer.amount;
    const paymentMethod = 'bank_transfer';
    const paymentReference = bankTransfer.transactionReference;

    // =============================================
    // 1. UPDATE INVOICE
    // =============================================
    await invoice.addPayment({
      amount: paymentAmount,
      method: paymentMethod,
      reference: paymentReference,
      date: new Date(),
      notes: `Manual bank transfer via ${bankTransfer.bankName}. Verified by admin.`
    });

    // =============================================
    // 2. UPDATE PROJECT
    // =============================================
    if (project) {
      const scheduleItem = project.paymentSchedule?.find(p => p.type === invoice.invoiceType);
      if (scheduleItem && scheduleItem.status !== 'paid') {
        scheduleItem.status = 'paid';
        scheduleItem.paidAt = new Date();
        scheduleItem.paymentReference = paymentReference;
        scheduleItem.paymentGateway = 'manual_bank_transfer';
        
        project.amountPaid = (project.amountPaid || 0) + paymentAmount;
        project.balance = project.totalCost - project.amountPaid;

        // Update project status based on payment type
        if (invoice.invoiceType === 'initial' && project.status === 'approved') {
          project.status = 'initial_paid';
        } else if (invoice.invoiceType === 'progress' && project.status === 'in_progress') {
          project.status = 'progress_paid';
        } else if (invoice.invoiceType === 'full') {
          project.status = 'full_paid';
          project.fullPaymentCompleted = true;
        } else if (project.amountPaid >= project.totalCost) {
          project.status = 'full_paid';
          project.fullPaymentCompleted = true;
        }

        await project.save({ session });
      }
    }

    // =============================================
    // 3. GENERATE RECEIPT
    // =============================================
    let receipt = null;
    try {
      // Map invoice type to receipt payment type enum
      let receiptPaymentType = 'full';
      switch (invoice.invoiceType) {
        case 'initial': receiptPaymentType = 'initial'; break;
        case 'progress': receiptPaymentType = 'progress'; break;
        case 'final': receiptPaymentType = 'final'; break;
        case 'full': receiptPaymentType = 'full'; break;
        default: receiptPaymentType = 'additional';
      }

      const customerName = `${client.contactFirstName || ''} ${client.contactLastName || ''}`.trim();

      receipt = await receiptService.generateReceipt({
        paymentType: receiptPaymentType,
        amount: paymentAmount,
        paymentMethod: `Bank Transfer (${bankTransfer.bankName})`,
        referenceNumber: bankTransfer.transactionReference,
        invoiceNumber: invoice.invoiceNumber,
        customer: {
          name: customerName,
          address: 'N/A',
          contact: client.contactNumber,
          email: clientUser?.email
        },
        projectName: project?.projectName || 'Solar Installation',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        notes: `Manual bank transfer via ${bankTransfer.bankName}. Transaction Ref: ${bankTransfer.transactionReference}`,
        paymentDate: new Date()
      });

      if (receipt && receipt.success) {
        invoice.receiptUrl = receipt.receiptUrl;
        invoice.receiptNumber = receipt.receiptNumber;
        await invoice.save({ session });
        console.log(`✅ Receipt generated: ${receipt.receiptNumber}`);
      }
    } catch (receiptError) {
      console.error('Receipt generation error (non-blocking):', receiptError.message);
    }

    // =============================================
    // 4. UPDATE BANK TRANSFER RECORD
    // =============================================
    bankTransfer.status = 'verified';
    bankTransfer.verifiedBy = adminId;
    bankTransfer.verifiedAt = new Date();
    bankTransfer.receiptUrl = invoice.receiptUrl || '';
    bankTransfer.receiptNumber = invoice.receiptNumber || '';
    await bankTransfer.save({ session });

    // =============================================
    // 5. COMMIT TRANSACTION
    // =============================================
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Bank transfer ${bankTransfer._id} approved for invoice ${invoice.invoiceNumber}`);

    res.json({
      success: true,
      message: 'Bank transfer payment approved successfully',
      data: {
        id: bankTransfer._id,
        status: bankTransfer.status,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus: invoice.paymentStatus,
        receiptUrl: invoice.receiptUrl,
        receiptNumber: invoice.receiptNumber,
        projectStatus: project?.status
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Approve bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve bank transfer',
      error: error.message
    });
  }
};

// =============================================
// ADMIN: Reject Bank Transfer Payment
// =============================================

// @desc    Reject a bank transfer payment
// @route   PUT /api/payments/bank-transfer/:id/reject
// @access  Private (Admin only)
const rejectBankTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Find the bank transfer payment
    const bankTransfer = await BankTransferPayment.findById(id)
      .populate('invoiceId')
      .populate('clientId');

    if (!bankTransfer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Bank transfer payment not found'
      });
    }

    // Check if already processed
    if (bankTransfer.status !== 'waiting_verification') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Payment already ${bankTransfer.status}. Cannot reject.`
      });
    }

    const invoice = bankTransfer.invoiceId;

    // Revert invoice payment status
    invoice.paymentStatus = 'pending';
    await invoice.save({ session });

    // Update bank transfer record
    bankTransfer.status = 'rejected';
    bankTransfer.verifiedBy = adminId;
    bankTransfer.verifiedAt = new Date();
    bankTransfer.rejectionReason = rejectionReason;
    await bankTransfer.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`❌ Bank transfer ${bankTransfer._id} rejected for invoice ${invoice.invoiceNumber}`);

    res.json({
      success: true,
      message: 'Bank transfer payment rejected',
      data: {
        id: bankTransfer._id,
        status: bankTransfer.status,
        rejectionReason: bankTransfer.rejectionReason,
        invoiceNumber: invoice.invoiceNumber
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Reject bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject bank transfer',
      error: error.message
    });
  }
};

// =============================================
// CUSTOMER: Get Bank Transfer Status
// =============================================

// @desc    Get bank transfer status for an invoice
// @route   GET /api/payments/bank-transfer/invoice/:invoiceId/status
// @access  Private (Customer)
const getBankTransferStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const payment = await BankTransferPayment.findOne({
      invoiceId: invoiceId,
      clientId: client._id
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.json({
        success: true,
        hasSubmission: false,
        message: 'No bank transfer submission found for this invoice'
      });
    }

    res.json({
      success: true,
      hasSubmission: true,
      data: {
        id: payment._id,
        status: payment.status,
        bankName: payment.bankName,
        amount: payment.amount,
        transactionReference: payment.transactionReference,
        transferDate: payment.transferDate,
        transferTime: payment.transferTime,
        proofOfPayment: payment.proofOfPayment,
        remarks: payment.remarks,
        createdAt: payment.createdAt,
        rejectionReason: payment.rejectionReason,
        receiptUrl: payment.receiptUrl,
        receiptNumber: payment.receiptNumber,
        verifiedAt: payment.verifiedAt
      }
    });

  } catch (error) {
    console.error('Get bank transfer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bank transfer status',
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  getCompanyBankAccounts,
  submitManualBankTransfer,
  getPendingBankTransfers,
  getBankTransferById,
  approveBankTransfer,
  rejectBankTransfer,
  getBankTransferStats,
  getBankTransferStatus
};