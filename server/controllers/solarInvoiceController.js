// controllers/solarInvoiceController.js
const SolarInvoice = require('../models/SolarInvoice');
const Project = require('../models/Project');
const Client = require('../models/Clients');
const mongoose = require('mongoose');
const PayMongoService = require('../services/paymongoService');
const File = require('../models/File');
const { processUpload, getFileUrl, deleteFile } = require('../middleware/uploadMiddleware');

// Helper function to format currency (for project updates)
const formatCurrencyHelper = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};
// @desc    Customer pays solar invoice (GCash manual upload)
// @route   POST /api/solar-invoices/:id/pay
// @access  Private (Customer)
exports.paySolarInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { paymentReference } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Payment proof is required' });
    }

    const invoice = await SolarInvoice.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber userId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.clientId.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    const processedFile = await processUpload(
      req,
      req.file,
      'payment-proofs',
      `invoice_payment_${invoice.invoiceNumber}_${Date.now()}`
    );

    const fileUrl = getFileUrl(req, processedFile);

    const fileRecord = new File({
      filename: processedFile.filename,
      originalName: processedFile.originalName,
      fileType: 'payment_proof',
      mimeType: processedFile.mimeType,
      size: processedFile.size,
      url: fileUrl,
      publicId: processedFile.publicId,
      uploadedBy: userId,
      userRole: 'customer',
      relatedTo: 'solar_invoice',
      relatedId: invoice._id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        paymentReference,
        amount: invoice.balance || invoice.totalAmount
      }
    });

    await fileRecord.save();

    invoice.payments.push({
      amount: invoice.balance || invoice.totalAmount,
      method: 'gcash',
      reference: paymentReference,
      proof: fileUrl,
      date: new Date(),
      notes: 'Payment submitted by customer for verification',
      receivedBy: null
    });

    invoice.paymentStatus = 'for_verification';
    invoice.status = 'pending';
    invoice.amountPaid = (invoice.amountPaid || 0) + (invoice.balance || invoice.totalAmount);
    invoice.balance = invoice.totalAmount - invoice.amountPaid;

    await invoice.save();

    // Update project's payment schedule if linked
    if (invoice.projectId) {
      const project = await Project.findById(invoice.projectId); // ✅ Now works without duplicate require
      if (project) {
        const scheduleItem = project.paymentSchedule.find(p => p.invoiceNumber === invoice.invoiceNumber);
        if (scheduleItem && scheduleItem.status !== 'paid') {
          scheduleItem.paymentReference = paymentReference;
          scheduleItem.paymentProof = fileUrl;
        }
        await project.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment submitted for verification',
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus: invoice.paymentStatus,
        amountPaid: invoice.amountPaid,
        balance: invoice.balance
      }
    });

  } catch (error) {
    console.error('Pay solar invoice error:', error);
    res.status(500).json({ message: 'Failed to submit payment', error: error.message });
  }
};

// @desc    Customer selects cash payment for solar invoice
// @route   POST /api/solar-invoices/:id/pay-cash
// @access  Private (Customer)
exports.paySolarInvoiceCash = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount } = req.body;

    const invoice = await SolarInvoice.findById(id)
      .populate('clientId', 'userId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.clientId.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    const paymentAmount = amount || invoice.balance || invoice.totalAmount;

    invoice.payments.push({
      amount: paymentAmount,
      method: 'cash',
      reference: 'Cash payment - pending verification',
      date: new Date(),
      notes: 'Customer selected cash payment. Awaiting office payment.',
      receivedBy: null
    });

    invoice.paymentStatus = 'pending';
    invoice.status = 'pending';

    await invoice.save();

    res.json({
      success: true,
      message: 'Cash payment selected. Please visit our office to complete payment.',
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus: invoice.paymentStatus
      }
    });

  } catch (error) {
    console.error('Pay solar invoice cash error:', error);
    res.status(500).json({ message: 'Failed to process cash payment', error: error.message });
  }
};

// @desc    Create PayMongo payment intent for solar invoice
// @route   POST /api/solar-invoices/:id/create-payment-intent
// @access  Private (Customer)
exports.getPayMongoPaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { paymentMethod } = req.body;

    const invoice = await SolarInvoice.findById(id)
      .populate('clientId', 'contactFirstName contactLastName userId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.clientId.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    const amount = invoice.balance || invoice.totalAmount;

    const paymentIntent = await PayMongoService.createPaymentIntent(
      amount,
      `Invoice ${invoice.invoiceNumber} - ${invoice.description}`,
      {
        type: 'solar_invoice',
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId._id.toString(),
        clientName: `${invoice.clientId.contactFirstName} ${invoice.clientId.contactLastName}`
      },
      paymentMethod === 'gcash' ? ['gcash'] : ['card']
    );

    if (!paymentIntent.success) {
      return res.status(500).json({ message: paymentIntent.error });
    }

    invoice.paymongoPaymentIntentId = paymentIntent.paymentIntentId;
    await invoice.save();

    if (paymentMethod === 'gcash') {
      const successUrl = `${process.env.FRONTEND_URL}/app/customer/payment-success?payment_intent_id=${paymentIntent.paymentIntentId}`;
      const cancelUrl = `${process.env.FRONTEND_URL}/app/customer/payment-cancel?payment_intent_id=${paymentIntent.paymentIntentId}`;

      const gcashPayment = await PayMongoService.createGCashPaymentSource(
        paymentIntent.paymentIntentId,
        successUrl,
        cancelUrl
      );

      if (!gcashPayment.success) {
        return res.status(500).json({ message: gcashPayment.error });
      }

      return res.json({
        success: true,
        redirectUrl: gcashPayment.redirectUrl,
        paymentIntentId: paymentIntent.paymentIntentId,
        type: 'redirect'
      });
    }

    return res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: amount,
      type: 'card'
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
  }
};

// @desc    Verify PayMongo payment for solar invoice
// @route   POST /api/solar-invoices/verify-payment
// @access  Private (Customer)
exports.verifyPayMongoPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    const invoice = await SolarInvoice.findOne({
      paymongoPaymentIntentId: paymentIntentId
    }).populate('clientId', 'userId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.clientId.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const paymentIntent = await PayMongoService.getPaymentIntent(paymentIntentId);

    if (!paymentIntent.success) {
      return res.status(500).json({ message: paymentIntent.error });
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        message: `Payment not successful. Status: ${paymentIntent.status}`
      });
    }

    invoice.paymentStatus = 'paid';
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.amountPaid = invoice.totalAmount;
    invoice.balance = 0;

    invoice.payments.push({
      amount: paymentIntent.amount,
      method: 'paymongo',
      reference: paymentIntentId,
      date: new Date(),
      notes: 'Payment verified via PayMongo',
      receivedBy: null
    });

    await invoice.save();

    // Update project payment schedule
    if (invoice.projectId) {
      const project = await Project.findById(invoice.projectId);
      if (project) {
        const scheduleItem = project.paymentSchedule.find(p => p.type === invoice.invoiceType);
        if (scheduleItem) {
          scheduleItem.status = 'paid';
          scheduleItem.paidAt = new Date();
        }

        project.amountPaid += invoice.totalAmount;
        project.balance = project.totalCost - project.amountPaid;

        // ✅ FIXED: Use full_paid for full payments
        if (invoice.invoiceType === 'initial') {
          project.status = 'initial_paid';
        } else if (invoice.invoiceType === 'progress') {
          project.status = 'progress_paid';
        } else if (invoice.invoiceType === 'full') {
          project.fullPaymentCompleted = true;
          project.status = 'full_paid';  // Changed from 'completed' to 'full_paid'
          // DO NOT set actualCompletionDate
        }

        await project.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus: invoice.paymentStatus,
        amountPaid: invoice.amountPaid
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};
// @desc    Admin verify solar invoice payment
// @route   PUT /api/solar-invoices/:id/verify
// @access  Private (Admin)
exports.verifySolarInvoicePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, notes } = req.body;
    const adminId = req.user.id;

    const invoice = await SolarInvoice.findById(id)
      .populate('projectId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.paymentStatus !== 'for_verification') {
      return res.status(400).json({ message: 'Invoice not pending verification' });
    }

    if (verified) {
      invoice.paymentStatus = 'paid';
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.amountPaid = invoice.totalAmount;
      invoice.balance = 0;

      // Update the payment record
      const gcashPayment = invoice.payments.find(p => p.method === 'gcash');
      if (gcashPayment) {
        gcashPayment.notes = `Verified by admin on ${new Date().toLocaleString()}. Notes: ${notes || 'N/A'}`;
      }

      invoice.adminRemarks = notes || 'Payment verified';
      invoice.verifiedBy = adminId;
      invoice.verifiedAt = new Date();

      // ✅ CRITICAL: Update the project's payment schedule and status
      if (invoice.projectId) {
        const project = await Project.findById(invoice.projectId);
        if (project) {
          // Find the payment schedule item
          let scheduleItem = project.paymentSchedule.find(p => p.type === invoice.invoiceType);
          
          if (!scheduleItem && invoice.invoiceNumber) {
            scheduleItem = project.paymentSchedule.find(p => p.invoiceNumber === invoice.invoiceNumber);
          }

          if (scheduleItem) {
            scheduleItem.status = 'paid';
            scheduleItem.paidAt = new Date();
            scheduleItem.paymentReference = invoice.payments.find(p => p.method === 'gcash')?.reference ||
              invoice.payments[0]?.reference ||
              `INV-${invoice.invoiceNumber}`;
            console.log(`✅ Updated payment schedule for ${invoice.invoiceType} payment`);
          }

          // Update project's amount paid and balance
          const paymentAmount = invoice.totalAmount;
          project.amountPaid = (project.amountPaid || 0) + paymentAmount;
          project.balance = project.totalCost - project.amountPaid;

          // ✅ FIXED: Update project status based on payment type - ALWAYS use full_paid for full payments
          if (invoice.invoiceType === 'initial') {
            if (project.status === 'approved') {
              project.status = 'initial_paid';
            }
          } else if (invoice.invoiceType === 'progress') {
            if (project.status === 'in_progress') {
              project.status = 'progress_paid';
            }
          } else if (invoice.invoiceType === 'full') {
            // ✅ Set to full_paid, NOT completed
            project.fullPaymentCompleted = true;
            project.status = 'full_paid';
            // DO NOT set actualCompletionDate - installation hasn't started
            console.log(`✅ Project ${project.projectReference} status updated to full_paid`);
          }

          // For installment projects when all payments are complete
          const allPaymentsPaid = project.paymentSchedule.every(p => p.status === 'paid');
          if (allPaymentsPaid && project.paymentPreference === 'installment') {
            if (project.status !== 'completed' && project.status !== 'full_paid') {
              project.status = 'full_paid';
              console.log(`✅ Project ${project.projectReference} status updated to full_paid (all installments paid)`);
            }
          }

          // Add to project updates
          project.projectUpdates = project.projectUpdates || [];
          project.projectUpdates.push({
            title: `Payment Verified - ${invoice.invoiceType.toUpperCase()}`,
            description: `Payment of ${formatCurrencyHelper(paymentAmount)} for ${invoice.invoiceType} payment has been verified. Project status: ${project.status}`,
            status: project.status,
            updatedBy: adminId
          });

          await project.save();
        }
      }

    } else {
      // Payment rejected - reset to pending
      invoice.paymentStatus = 'pending';
      invoice.status = 'pending';
      invoice.adminRemarks = notes || 'Payment rejected - please resubmit';

      const gcashPayment = invoice.payments.find(p => p.method === 'gcash');
      if (gcashPayment) {
        gcashPayment.notes = `REJECTED by admin on ${new Date().toLocaleString()}. Reason: ${notes || 'No reason provided'}`;
      }

      // Reset project payment schedule
      if (invoice.projectId) {
        const project = await Project.findById(invoice.projectId);
        if (project) {
          const scheduleItem = project.paymentSchedule.find(p => p.type === invoice.invoiceType);
          if (scheduleItem && scheduleItem.status !== 'paid') {
            scheduleItem.status = 'pending';
            scheduleItem.paymentReference = null;
            scheduleItem.paymentProof = null;
            await project.save();
          }
        }
      }
    }

    await invoice.save();

    res.json({
      success: true,
      message: verified ? 'Payment verified successfully' : 'Payment rejected',
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus: invoice.paymentStatus,
        status: invoice.status
      }
    });

  } catch (error) {
    console.error('Verify solar invoice error:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};

// @desc    Admin reject solar invoice payment
// @route   PUT /api/solar-invoices/:id/reject-payment
// @access  Private (Admin)
exports.rejectSolarInvoicePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const invoice = await SolarInvoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.paymentStatus = 'failed';
    invoice.status = 'cancelled';
    invoice.adminRemarks = notes || 'Payment rejected by admin';
    invoice.rejectedBy = adminId;
    invoice.rejectedAt = new Date();

    await invoice.save();

    // Optionally update project payment schedule to mark as failed/cancelled
    if (invoice.projectId) {
      const project = await Project.findById(invoice.projectId);
      if (project) {
        const scheduleItem = project.paymentSchedule.find(p => p.type === invoice.invoiceType);
        if (scheduleItem && scheduleItem.status !== 'paid') {
          scheduleItem.status = 'pending'; // Reset to pending, customer needs to pay again
          scheduleItem.paymentReference = null;
        }
        await project.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment rejected',
      invoice
    });

  } catch (error) {
    console.error('Reject solar invoice error:', error);
    res.status(500).json({ message: 'Failed to reject payment', error: error.message });
  }
};
// @desc    Create new solar installation invoice
// @route   POST /api/solar-invoices
// @access  Private (Admin)
exports.createSolarInvoice = async (req, res) => {
  try {
    const {
      projectId,
      invoiceType,
      description,
      items,
      subtotal,
      tax,
      discount,
      totalAmount,
      dueDate,
      notes
    } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify project is not already completed
    if (project.status === 'completed') {
      return res.status(400).json({ message: 'Cannot create invoice for completed project' });
    }

    // Check if invoice type already exists for this project
    const existingInvoice = await SolarInvoice.findOne({
      projectId,
      invoiceType,
      status: { $ne: 'cancelled' }
    });

    if (existingInvoice) {
      return res.status(400).json({ message: `${invoiceType} invoice already exists for this project` });
    }

    const invoice = new SolarInvoice({
      projectId,
      clientId: project.clientId,
      userId: project.userId,
      invoiceType,
      description,
      items,
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      totalAmount,
      dueDate: new Date(dueDate),
      notes,
      status: 'draft',
      paymentStatus: 'pending',
      createdBy: req.user.id
    });

    await invoice.save();

    // Update project's invoice list
    project.invoices.push({
      type: invoiceType,
      invoiceNumber: invoice.invoiceNumber,
      amount: totalAmount,
      issuedAt: new Date()
    });
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Solar installation invoice created successfully',
      invoice
    });

  } catch (error) {
    console.error('Create solar invoice error:', error);
    res.status(500).json({ message: 'Failed to create invoice', error: error.message });
  }
};

// @desc    Get all solar invoices (Admin)
// @route   GET /api/solar-invoices
// @access  Private (Admin)
exports.getAllSolarInvoices = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const invoices = await SolarInvoice.find(query)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('projectId', 'projectName projectReference systemSize totalCost')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SolarInvoice.countDocuments(query);

    res.json({
      success: true,
      invoices,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get solar invoices error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices', error: error.message });
  }
};

// @desc    Get client's solar invoices
// @route   GET /api/solar-invoices/my-invoices
// @access  Private (Customer)
exports.getMySolarInvoices = async (req, res) => {
  try {
    const userId = req.user.id;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const invoices = await SolarInvoice.find({ clientId: client._id })
      .populate('projectId', 'projectName projectReference systemSize status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invoices
    });

  } catch (error) {
    console.error('Get my solar invoices error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices', error: error.message });
  }
};

// @desc    Get invoices by project
// @route   GET /api/solar-invoices/project/:projectId
// @access  Private (Admin)
exports.getInvoicesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const invoices = await SolarInvoice.find({ projectId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invoices
    });

  } catch (error) {
    console.error('Get invoices by project error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices', error: error.message });
  }
};

// @desc    Get invoice by ID
// @route   GET /api/solar-invoices/:id
// @access  Private
exports.getSolarInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const invoice = await SolarInvoice.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber email')
      .populate('projectId', 'projectName projectReference systemSize status totalCost amountPaid')
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .populate('payments.receivedBy', 'firstName lastName');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check authorization
    const client = await Client.findOne({ userId });
    if (userRole !== 'admin' && userRole !== 'engineer' && invoice.clientId._id.toString() !== client?._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Get solar invoice error:', error);
    res.status(500).json({ message: 'Failed to fetch invoice', error: error.message });
  }
};

// @desc    Send invoice to client
// @route   PUT /api/solar-invoices/:id/send
// @access  Private (Admin)
exports.sendSolarInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await SolarInvoice.findById(id)
      .populate('clientId', 'contactFirstName contactLastName email')
      .populate('projectId', 'projectName');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ message: 'Invoice already sent' });
    }

    invoice.status = 'sent';
    invoice.sentAt = new Date();

    await invoice.save();

    // TODO: Send email notification with PDF attachment
    // await sendInvoiceEmail(invoice);

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      invoice
    });

  } catch (error) {
    console.error('Send solar invoice error:', error);
    res.status(500).json({ message: 'Failed to send invoice', error: error.message });
  }
};

// @desc    Record payment for solar invoice (Admin)
// @route   POST /api/solar-invoices/:id/payment
// @access  Private (Admin)
exports.recordSolarPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, reference, notes } = req.body;
    const adminId = req.user.id;

    const invoice = await SolarInvoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    // Add payment record
    invoice.payments.push({
      amount: amount,
      method: method,
      reference: reference,
      date: new Date(),
      notes: notes,
      receivedBy: adminId
    });

    invoice.amountPaid = (invoice.amountPaid || 0) + amount;
    invoice.balance = invoice.totalAmount - invoice.amountPaid;

    if (invoice.balance <= 0) {
      invoice.paymentStatus = 'paid';
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    } else if (invoice.amountPaid > 0) {
      invoice.paymentStatus = 'partial';
    }

    await invoice.save();

    // ✅ Update project payment schedule
    if (invoice.projectId) {
      const project = await Project.findById(invoice.projectId);
      if (project) {
        const scheduleItem = project.paymentSchedule.find(p => p.type === invoice.invoiceType);
        if (scheduleItem) {
          scheduleItem.status = 'paid';
          scheduleItem.paidAt = new Date();
          scheduleItem.paymentReference = reference;
        }

        project.amountPaid = (project.amountPaid || 0) + amount;
        project.balance = project.totalCost - project.amountPaid;

        if (invoice.invoiceType === 'initial' && project.status === 'approved') {
          project.status = 'initial_paid';
        } else if (invoice.invoiceType === 'progress' && project.status === 'in_progress') {
          project.status = 'progress_paid';
        } else if (invoice.invoiceType === 'full') {
          project.fullPaymentCompleted = true;
          project.status = 'completed';
          project.actualCompletionDate = new Date();
        }

        const allPaymentsPaid = project.paymentSchedule.every(p => p.status === 'paid');
        if (allPaymentsPaid && project.status !== 'completed' && project.paymentPreference === 'installment') {
          project.status = 'completed';
          project.actualCompletionDate = new Date();
        }

        await project.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      invoice
    });

  } catch (error) {
    console.error('Record solar payment error:', error);
    res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
};

// @desc    Download invoice PDF
// @route   GET /api/solar-invoices/:id/download
// @access  Private
exports.downloadSolarInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const invoice = await SolarInvoice.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber address')
      .populate('projectId', 'projectName projectReference systemSize');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check authorization
    const client = await Client.findOne({ userId });
    if (userRole !== 'admin' && userRole !== 'engineer' && invoice.clientId._id.toString() !== client?._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // TODO: Generate PDF and send
    // For now, return invoice data
    res.json({
      success: true,
      invoice,
      message: 'PDF generation will be implemented'
    });

  } catch (error) {
    console.error('Download solar invoice error:', error);
    res.status(500).json({ message: 'Failed to download invoice', error: error.message });
  }
};

// @desc    Cancel invoice
// @route   PUT /api/solar-invoices/:id/cancel
// @access  Private (Admin/Customer)
exports.cancelSolarInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const invoice = await SolarInvoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check authorization
    const client = await Client.findOne({ userId });
    if (userRole !== 'admin' && invoice.clientId.toString() !== client?._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Cannot cancel paid invoice' });
    }

    invoice.status = 'cancelled';
    invoice.paymentStatus = 'cancelled';
    invoice.cancelledAt = new Date();

    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice cancelled successfully',
      invoice
    });

  } catch (error) {
    console.error('Cancel solar invoice error:', error);
    res.status(500).json({ message: 'Failed to cancel invoice', error: error.message });
  }
};

// @desc    Update invoice
// @route   PUT /api/solar-invoices/:id
// @access  Private (Admin)
exports.updateSolarInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const invoice = await SolarInvoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ message: 'Cannot update invoice that has been sent' });
    }

    const updatedInvoice = await SolarInvoice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });

  } catch (error) {
    console.error('Update solar invoice error:', error);
    res.status(500).json({ message: 'Failed to update invoice', error: error.message });
  }
};

// @desc    Get solar invoice stats for admin dashboard
// @route   GET /api/solar-invoices/stats
// @access  Private (Admin)
// controllers/solarInvoiceController.js - Updated stats function
exports.getSolarInvoiceStats = async (req, res) => {
  try {


    // Get counts
    const total = await SolarInvoice.countDocuments();
    const pending = await SolarInvoice.countDocuments({ paymentStatus: 'pending' });
    const paid = await SolarInvoice.countDocuments({ paymentStatus: 'paid' });
    const partial = await SolarInvoice.countDocuments({ paymentStatus: 'partial' });
    const overdue = await SolarInvoice.countDocuments({ paymentStatus: 'overdue' });
    const cancelled = await SolarInvoice.countDocuments({ paymentStatus: 'cancelled' });



    // Calculate total revenue from paid invoices (using paidAt for accurate timing)
    const revenueResult = await SolarInvoice.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Calculate pending amount from unpaid invoices
    const pendingResult = await SolarInvoice.aggregate([
      { $match: { paymentStatus: { $in: ['pending', 'partial'] } } },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);
    const pendingAmount = pendingResult[0]?.total || 0;

    // Get monthly revenue for the last 12 months using paidAt
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1);

    const monthlyRevenue = await SolarInvoice.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          paidAt: { $gte: startDate, $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing months with zero values
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthKey);
    }

    const fullMonthlyRevenue = months.map(month => {
      const found = monthlyRevenue.find(m => m._id === month);
      return {
        month,
        total: found?.total || 0,
        count: found?.count || 0
      };
    });



    res.json({
      success: true,
      stats: {
        total,
        pending,
        paid,
        partial,
        overdue,
        cancelled,
        totalRevenue,
        pendingAmount,
        monthlyRevenue: fullMonthlyRevenue
      }
    });

  } catch (error) {
    console.error('Get solar invoice stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};