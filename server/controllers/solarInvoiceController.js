// controllers/solarInvoiceController.js
const SolarInvoice = require('../models/SolarInvoice');
const Project = require('../models/Project');
const Client = require('../models/Clients');
const mongoose = require('mongoose');

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

// @desc    Record payment for solar invoice
// @route   POST /api/solar-invoices/:id/payment
// @access  Private (Admin)
// controllers/solarInvoiceController.js - Fix recordSolarPayment
exports.recordSolarPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { amount, method, reference, proof, notes } = req.body;

    const invoice = await SolarInvoice.findById(id).session(session);
    if (!invoice) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.paymentStatus === 'paid') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    // Add payment
    invoice.payments.push({
      amount,
      method,
      reference,
      proof,
      notes,
      receivedBy: req.user.id,
      date: new Date()
    });
    
    invoice.amountPaid += amount;
    invoice.calculateBalance();
    
    // Update status based on new balance
    if (invoice.balance <= 0) {
      invoice.paymentStatus = 'paid';
      invoice.status = 'paid';
      invoice.paidAt = new Date(); // <-- THIS SETS paidAt WHEN FULLY PAID
    } else if (invoice.amountPaid > 0) {
      invoice.paymentStatus = 'partial';
      // Keep existing paidAt or set to null if not fully paid
      // invoice.paidAt remains null or previous value
    }

    await invoice.save({ session });

    // Update project payment schedule
    const project = await Project.findById(invoice.projectId).session(session);
    if (project) {
      const scheduleItem = project.paymentSchedule?.find(p => p.type === invoice.invoiceType);
      if (scheduleItem) {
        scheduleItem.paidAt = new Date();
        scheduleItem.status = 'paid';
        scheduleItem.invoiceNumber = invoice.invoiceNumber;
      }
      
      project.amountPaid += amount;
      if (project.calculateBalance) project.calculateBalance();
      
      // Update project status based on payments
      if (project.amountPaid >= project.totalCost) {
        project.status = 'completed';
        project.actualCompletionDate = new Date();
      } else if (project.amountPaid >= (project.initialPayment || 0) && project.status === 'approved') {
        project.status = 'in_progress';
      }
      
      await project.save({ session });
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus: invoice.paymentStatus,
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        paidAt: invoice.paidAt
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Record solar payment error:', error);
    res.status(500).json({ message: 'Failed to record payment', error: error.message });
  } finally {
    session.endSession();
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