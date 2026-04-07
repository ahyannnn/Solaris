const PayMongoService = require('../services/paymongoService');
const PreAssessment = require('../models/PreAssessment');
const Project = require('../models/Project');
const Client = require('../models/Clients');
const SolarInvoice = require('../models/SolarInvoice');

// @desc    Create payment intent for pre-assessment (works for both card and GCash)
// @route   POST /api/payments/pre-assessment/:id/create-intent
// @access  Private (Customer)
exports.createPreAssessmentPaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { paymentMethod } = req.body;

    console.log('Creating payment intent for pre-assessment:', { id, paymentMethod });

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    let assessment = await PreAssessment.findById(id);
    if (!assessment) {
      assessment = await PreAssessment.findOne({ 
        bookingReference: id,
        clientId: client._id 
      });
    }

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found', id: id });
    }

    if (assessment.paymentStatus !== 'pending') {
      return res.status(400).json({ 
        message: `Payment already processed. Status: ${assessment.paymentStatus}` 
      });
    }

    // Determine which payment methods to allow
    const paymentMethods = paymentMethod === 'gcash' ? ['gcash'] : ['card'];
    
    // Create payment intent
    const paymentIntent = await PayMongoService.createPaymentIntent(
      assessment.assessmentFee,
      `Pre-Assessment Fee - ${assessment.bookingReference}`,
      {
        type: 'pre_assessment',
        preAssessmentId: assessment._id.toString(),
        bookingReference: assessment.bookingReference,
        clientId: client._id.toString(),
        clientName: `${client.contactFirstName} ${client.contactLastName}`,
        paymentMethod: paymentMethod || 'card'
      },
      paymentMethods
    );

    if (!paymentIntent.success) {
      return res.status(500).json({ message: paymentIntent.error });
    }

    // Store payment intent ID
    assessment.paymongoPaymentIntentId = paymentIntent.paymentIntentId;
    assessment.paymentGateway = 'paymongo';
    await assessment.save();

    // For GCash, create payment source and return redirect URL
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

    // For Card payments, return client secret for frontend processing
    return res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: paymentIntent.amount,
      type: 'card'
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment intent', 
      error: error.message 
    });
  }
};
// Add this function to paymentController.js

// @desc    Create payment intent for solar invoice (for both card and GCash)
// @route   POST /api/payments/invoice/:id/create-intent
// @access  Private (Customer)
exports.createSolarInvoicePaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { paymentMethod } = req.body;

    console.log('Creating payment intent for solar invoice:', { id, paymentMethod });

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const invoice = await SolarInvoice.findById(id).populate('projectId');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Verify invoice belongs to this client
    if (invoice.clientId.toString() !== client._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    const amount = invoice.balance || invoice.totalAmount;
    
    // Determine which payment methods to allow
    const paymentMethods = paymentMethod === 'gcash' ? ['gcash'] : ['card'];
    
    // Create payment intent
    const paymentIntent = await PayMongoService.createPaymentIntent(
      amount,
      `${invoice.invoiceType.toUpperCase()} Payment - ${invoice.invoiceNumber}`,
      {
        type: 'solar_invoice',
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
        projectId: invoice.projectId?._id.toString(),
        projectName: invoice.projectId?.projectName,
        clientId: client._id.toString(),
        clientName: `${client.contactFirstName} ${client.contactLastName}`,
        paymentMethod: paymentMethod || 'card'
      },
      paymentMethods
    );

    if (!paymentIntent.success) {
      return res.status(500).json({ message: paymentIntent.error });
    }

    // Store payment intent ID on invoice
    invoice.paymongoPaymentIntentId = paymentIntent.paymentIntentId;
    await invoice.save();

    // For GCash, create payment source and return redirect URL
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

    // For Card payments, return client secret for frontend processing
    return res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: paymentIntent.amount,
      type: 'card'
    });

  } catch (error) {
    console.error('Create solar invoice payment intent error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment intent', 
      error: error.message 
    });
  }
};
// Update the processCardPayment function to handle both pre-assessment AND solar invoices

exports.processCardPayment = async (req, res) => {
  try {
    const { paymentIntentId, cardDetails } = req.body;
    const userId = req.user.id;

    console.log('Processing card payment for:', paymentIntentId);

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Try to find as pre-assessment first
    let assessment = await PreAssessment.findOne({ 
      paymongoPaymentIntentId: paymentIntentId,
      clientId: client._id
    });

    // If not found, try to find as solar invoice
    let invoice = null;
    if (!assessment) {
      invoice = await SolarInvoice.findOne({ 
        paymongoPaymentIntentId: paymentIntentId,
        clientId: client._id
      }).populate('projectId');
    }

    if (!assessment && !invoice) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // If already paid, return success
    if (assessment?.paymentStatus === 'paid' || invoice?.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already completed',
        data: assessment ? {
          bookingReference: assessment.bookingReference,
          invoiceNumber: assessment.invoiceNumber
        } : {
          invoiceNumber: invoice.invoiceNumber,
          paymentStatus: invoice.paymentStatus
        }
      });
    }

    // Create payment method
    const paymentMethod = await PayMongoService.createCardPaymentMethod(
      cardDetails,
      {
        name: `${client.contactFirstName} ${client.contactLastName}`,
        email: client.userId?.email || 'customer@example.com'
      }
    );

    if (!paymentMethod.success) {
      return res.status(500).json({ message: paymentMethod.error });
    }

    // Attach payment method to intent
    const returnUrl = `${process.env.FRONTEND_URL}/app/customer/payment-success?payment_intent_id=${paymentIntentId}`;
    
    const attachResult = await PayMongoService.attachPaymentMethod(
      paymentIntentId,
      paymentMethod.paymentMethodId,
      returnUrl
    );

    if (!attachResult.success) {
      return res.status(500).json({ message: attachResult.error });
    }

    // Check if payment succeeded
    if (attachResult.status === 'succeeded') {
      if (assessment) {
        // Update pre-assessment
        assessment.paymentStatus = 'paid';
        assessment.assessmentStatus = 'scheduled';
        assessment.paymentMethod = 'card';
        assessment.paymentGateway = 'paymongo';
        assessment.autoVerified = true;
        assessment.paymentCompletedAt = new Date();
        assessment.confirmedAt = new Date();
        await assessment.save();
      } else if (invoice) {
        // Update solar invoice
        invoice.paymentStatus = 'paid';
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.amountPaid = invoice.totalAmount;
        invoice.balance = 0;
        
        invoice.payments.push({
          amount: invoice.totalAmount,
          method: 'paymongo',
          reference: paymentIntentId,
          date: new Date(),
          notes: 'Payment verified via PayMongo',
          receivedBy: null
        });
        
        await invoice.save();
        
        // Update project payment schedule if linked
        if (invoice.projectId) {
          const project = await Project.findById(invoice.projectId);
          if (project) {
            const scheduleItem = project.paymentSchedule.find(p => p.type === invoice.invoiceType);
            if (scheduleItem) {
              scheduleItem.status = 'paid';
              scheduleItem.paidAt = new Date();
              scheduleItem.paymentGateway = 'paymongo';
              scheduleItem.paymentReference = paymentIntentId;
            }
            
            project.amountPaid += invoice.totalAmount;
            project.balance = project.totalCost - project.amountPaid;
            
            // ✅ CORRECTED: Update project status based on payment type
            if (invoice.invoiceType === 'initial' && project.status === 'approved') {
              project.status = 'initial_paid';
            } else if (invoice.invoiceType === 'progress' && project.status === 'in_progress') {
              project.status = 'progress_paid';
            } else if (invoice.invoiceType === 'final') {
              // Final payment (installment plan) - project is COMPLETE
              project.fullPaymentCompleted = true;
              project.status = 'completed';
              project.actualCompletionDate = new Date();
            } else if (invoice.invoiceType === 'full') {
              // Full payment (one-time upfront) - just full_paid, waiting for installation
              project.fullPaymentCompleted = true;
              project.status = 'full_paid';
              // DO NOT set actualCompletionDate
            }
            
            await project.save();
          }
        }
      }

      return res.json({
        success: true,
        message: 'Payment successful',
        data: assessment ? {
          bookingReference: assessment.bookingReference,
          invoiceNumber: assessment.invoiceNumber
        } : {
          invoiceNumber: invoice.invoiceNumber,
          paymentStatus: invoice.paymentStatus
        }
      });
    }

    return res.json({
      success: false,
      message: `Payment status: ${attachResult.status}`,
      status: attachResult.status
    });

  } catch (error) {
    console.error('Process card payment error:', error);
    res.status(500).json({ message: 'Failed to process payment', error: error.message });
  }
};

// @desc    Verify payment by payment intent ID (for both card and GCash)
// @route   GET /api/payments/verify/:paymentIntentId
// @access  Private (Customer)
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.user.id;

    console.log('Verifying payment by ID:', paymentIntentId);

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Find assessment by payment intent ID
    const assessment = await PreAssessment.findOne({ 
      paymongoPaymentIntentId: paymentIntentId,
      clientId: client._id
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // If already paid, return success
    if (assessment.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        type: 'pre_assessment',
        data: {
          bookingReference: assessment.bookingReference,
          invoiceNumber: assessment.invoiceNumber
        }
      });
    }

    // Check with PayMongo API
    const paymentIntent = await PayMongoService.getPaymentIntent(paymentIntentId);

    if (!paymentIntent.success) {
      return res.status(500).json({ message: paymentIntent.error });
    }

    console.log('Payment intent status:', paymentIntent.status, 'isPaid:', paymentIntent.isPaid);

    // Check if payment is successful
    if (paymentIntent.status === 'succeeded' || paymentIntent.isPaid === true) {
      // Update assessment to paid
      assessment.paymentStatus = 'paid';
      assessment.assessmentStatus = 'scheduled';
      assessment.autoVerified = true;
      assessment.paymentMethod = paymentIntent.paymentMethod?.includes('gcash') ? 'gcash' : 'card';
      assessment.paymentGateway = 'paymongo';
      assessment.paymentCompletedAt = new Date();
      assessment.confirmedAt = new Date();
      
      // Store payment details from response
      if (paymentIntent.paymentDetails) {
        assessment.paymentReference = paymentIntent.paymentDetails.id;
      }
      
      await assessment.save();

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        type: 'pre_assessment',
        data: {
          bookingReference: assessment.bookingReference,
          invoiceNumber: assessment.invoiceNumber,
          paymentStatus: assessment.paymentStatus
        }
      });
    }

    // Payment not yet successful
    return res.json({
      success: false,
      message: `Payment status: ${paymentIntent.status}`,
      status: paymentIntent.status
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ 
      message: 'Failed to verify payment', 
      error: error.message 
    });
  }
};

// @desc    Get test card (development only)
// @route   GET /api/payments/test-card
// @access  Private
exports.getTestCard = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not available in production' });
  }
  
  res.json({
    success: true,
    testCard: PayMongoService.getTestCard()
  });
};

