// controllers/freeQuoteControllers.js
const FreeQuote = require('../models/FreeQuote');
const Client = require('../models/Clients'); // <-- THIS IS THE IMPORT - MUST BE Client, not Clients
const Address = require('../models/Address');
const mongoose = require('mongoose');



// @desc    Create a new free quote request
// @route   POST /api/free-quotes
// @access  Private (Customer)
// In freeQuoteControllers.js
exports.createFreeQuote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clientId, addressId, monthlyBill, propertyType, desiredCapacity } = req.body;

    // Find client
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Verify client ID matches
    if (client._id.toString() !== clientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Verify address if provided
    if (addressId) {
      const address = await Address.findOne({ _id: addressId, clientId: client._id });
      if (!address) {
        return res.status(404).json({ success: false, message: 'Address not found' });
      }
    }

    // Generate quotation reference in controller (no middleware needed)
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const quotationReference = `Q-${year}${month}${day}-${random}`;

    // Create free quote object with the generated reference
    const freeQuote = new FreeQuote({
      clientId: client._id,
      addressId: addressId || null,
      monthlyBill: parseFloat(monthlyBill),
      propertyType: propertyType,
      desiredCapacity: desiredCapacity || '',
      status: 'pending',
      quotationReference: quotationReference  // Add the generated reference here
    });

    // Save to database
    await freeQuote.save();

    // Populate references for response
    await freeQuote.populate('clientId', 'contactFirstName contactLastName contactNumber');
    await freeQuote.populate('addressId');
    await freeQuote.populate({
      path: 'clientId',
      populate: { path: 'userId', select: 'email' }
    });

    res.status(201).json({
      success: true,
      message: 'Free quote request submitted successfully',
      quote: {
        _id: freeQuote._id,
        quotationReference: freeQuote.quotationReference,
        monthlyBill: freeQuote.monthlyBill,
        propertyType: freeQuote.propertyType,
        desiredCapacity: freeQuote.desiredCapacity,
        status: freeQuote.status,
        requestedAt: freeQuote.requestedAt,
        client: {
          name: `${freeQuote.clientId.contactFirstName} ${freeQuote.clientId.contactLastName}`,
          contactNumber: freeQuote.clientId.contactNumber,
          email: freeQuote.clientId.userId?.email
        },
        address: freeQuote.addressId ? {
          fullAddress: freeQuote.addressId.getFullAddress ? freeQuote.addressId.getFullAddress() : 'Address'
        } : null
      }
    });

  } catch (error) {
    console.error('Create free quote error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit quote request', 
      error: error.message 
    });
  }
};

// @desc    Get all free quotes (Admin only)
// @route   GET /api/free-quotes
// @access  Private (Admin)
exports.getAllFreeQuotes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const quotes = await FreeQuote.find(query)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('addressId')
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'email' }
      })
      .sort({ requestedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FreeQuote.countDocuments(query);

    res.json({
      success: true,
      quotes,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get free quotes error:', error);
    res.status(500).json({ message: 'Failed to fetch quotes', error: error.message });
  }
};

// @desc    Get client's free quotes
// @route   GET /api/free-quotes/my-quotes
// @access  Private (Customer)
exports.getMyFreeQuotes = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const quotes = await FreeQuote.find({ clientId: client._id })
      .populate('addressId')
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      quotes
    });

  } catch (error) {
    console.error('Get my free quotes error:', error);
    res.status(500).json({ message: 'Failed to fetch quotes', error: error.message });
  }
};

// @desc    Get free quote by ID
// @route   GET /api/free-quotes/:id
// @access  Private (Customer or Admin)
exports.getFreeQuoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const quote = await FreeQuote.findById(id)
      .populate('clientId', 'contactFirstName contactLastName contactNumber')
      .populate('addressId')
      .populate({
        path: 'clientId',
        populate: { path: 'userId', select: 'email' }
      })
      .populate('processedBy', 'email firstName lastName');

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Check authorization
    const client = await Client.findOne({ userId });
    if (userRole !== 'admin' && quote.clientId._id.toString() !== client?._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      success: true,
      quote
    });

  } catch (error) {
    console.error('Get free quote error:', error);
    res.status(500).json({ message: 'Failed to fetch quote', error: error.message });
  }
};

// @desc    Update free quote status (Admin only)
// @route   PUT /api/free-quotes/:id/status
// @access  Private (Admin)
exports.updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, quotationFile } = req.body;
    const adminId = req.user.id;

    const quote = await FreeQuote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    quote.status = status;
    if (adminRemarks) quote.adminRemarks = adminRemarks;
    if (quotationFile) quote.quotationFile = quotationFile;
    if (status === 'completed') {
      quote.quotationSentAt = new Date();
    }
    quote.processedBy = adminId;
    quote.processedAt = new Date();

    await quote.save();

    res.json({
      success: true,
      message: 'Quote status updated successfully',
      quote
    });

  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({ message: 'Failed to update quote', error: error.message });
  }
};

// @desc    Upload quotation file (Admin only)
// @route   POST /api/free-quotes/:id/upload-quotation
// @access  Private (Admin)
exports.uploadQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const quote = await FreeQuote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    quote.quotationFile = req.file.path;
    quote.status = 'completed';
    quote.quotationSentAt = new Date();
    quote.processedBy = req.user.id;
    quote.processedAt = new Date();

    await quote.save();

    res.json({
      success: true,
      message: 'Quotation uploaded successfully',
      quotationFile: quote.quotationFile
    });

  } catch (error) {
    console.error('Upload quotation error:', error);
    res.status(500).json({ message: 'Failed to upload quotation', error: error.message });
  }
};

// @desc    Cancel free quote (Customer)
// @route   PUT /api/free-quotes/:id/cancel
// @access  Private (Customer)
exports.cancelFreeQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const quote = await FreeQuote.findOne({ _id: id, clientId: client._id });
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    if (quote.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel quote that is already being processed' });
    }

    quote.status = 'cancelled';
    await quote.save();

    res.json({
      success: true,
      message: 'Quote cancelled successfully',
      quote
    });

  } catch (error) {
    console.error('Cancel free quote error:', error);
    res.status(500).json({ message: 'Failed to cancel quote', error: error.message });
  }
};