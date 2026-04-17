const PayMongoService = require('../services/paymongoService');
const PreAssessment = require('../models/PreAssessment');
const Project = require('../models/Project');
const Client = require('../models/Clients');
const receiptService = require('../services/receiptService');

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

// @desc    Process card payment (attach payment method and confirm)
// @route   POST /api/payments/process-card-payment
// @access  Private (Customer)
exports.processCardPayment = async (req, res) => {
  try {
    const { paymentIntentId, cardDetails } = req.body;
    const userId = req.user.id;

    console.log('Processing card payment for:', paymentIntentId);

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // ✅ ADD POPULATION for receipt generation
    const assessment = await PreAssessment.findOne({ 
      paymongoPaymentIntentId: paymentIntentId,
      clientId: client._id
    }).populate('clientId', 'contactFirstName contactLastName contactNumber userId')
      .populate('clientId.userId', 'email')
      .populate('addressId');  // For address in receipt

    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already completed',
        data: {
          bookingReference: assessment.bookingReference,
          invoiceNumber: assessment.invoiceNumber
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

    // Attach payment method
    const attachResult = await PayMongoService.attachPaymentMethod(
      paymentIntentId,
      paymentMethod.paymentMethodId,
      null
    );

    if (!attachResult.success) {
      return res.status(500).json({ message: attachResult.error });
    }

    // Check if payment succeeded
    if (attachResult.status === 'succeeded') {
      assessment.paymentStatus = 'paid';
      assessment.assessmentStatus = 'scheduled';
      assessment.paymentMethod = 'card';
      assessment.paymentGateway = 'paymongo';
      assessment.autoVerified = true;
      assessment.paymentCompletedAt = new Date();
      assessment.confirmedAt = new Date();
      
      // ✅ GENERATE RECEIPT FOR CARD PAYMENT
      let receipt = null;
      try {
        const customerName = `${assessment.clientId.contactFirstName || ''} ${assessment.clientId.contactLastName || ''}`.trim();
        
        // Format address
        let addressString = '';
        if (assessment.addressId) {
          const addr = assessment.addressId;
          addressString = `${addr.houseOrBuilding || ''} ${addr.street || ''}, ${addr.barangay || ''}, ${addr.cityMunicipality || ''}`.trim();
        }
        
        receipt = await receiptService.generateReceipt({
          paymentType: 'pre_assessment',
          amount: assessment.assessmentFee,
          paymentMethod: 'card',
          referenceNumber: paymentIntentId,
          invoiceNumber: assessment.invoiceNumber,
          customer: {
            name: customerName,
            address: addressString || 'N/A',
            contact: assessment.clientId.contactNumber,
            email: assessment.clientId.userId?.email
          },
          projectName: null,
          verifiedBy: userId,
          verifiedAt: new Date(),
          notes: 'Card payment auto-verified via PayMongo',
          paymentDate: new Date()
        });

        if (receipt.success) {
          assessment.receiptUrl = receipt.receiptUrl;
          assessment.receiptNumber = receipt.receiptNumber;
          console.log(`✅ Receipt generated for card payment: ${receipt.receiptNumber}`);
        }
      } catch (receiptError) {
        console.error('Receipt generation error:', receiptError);
        // Don't block payment success if receipt fails
      }
      
      await assessment.save();

      return res.json({
        success: true,
        message: 'Payment successful',
        receipt: receipt?.success ? {
          url: receipt.receiptUrl,
          number: receipt.receiptNumber
        } : null,
        data: {
          bookingReference: assessment.bookingReference,
          invoiceNumber: assessment.invoiceNumber,
          receiptUrl: assessment.receiptUrl,
          receiptNumber: assessment.receiptNumber
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

