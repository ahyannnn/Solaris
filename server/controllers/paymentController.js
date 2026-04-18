const PayMongoService = require('../services/paymongoService');
const PreAssessment = require('../models/PreAssessment');
const Project = require('../models/Project');
const Client = require('../models/Clients');
const SolarInvoice = require('../models/SolarInvoice');
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

// ============ INVOICE PAYMENT INTENT ============

// @desc    Create payment intent for solar invoice payment (Project Bill)
// @route   POST /api/payments/invoice/:invoiceId/create-intent
// @access  Private (Customer)
exports.createInvoicePaymentIntent = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;
    const { paymentMethod } = req.body;

    console.log('Creating payment intent for invoice:', { invoiceId, paymentMethod });

    // Get client
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Get invoice
    const invoice = await SolarInvoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Verify ownership
    if (invoice.clientId.toString() !== client._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if invoice is already paid
    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Invoice already paid' });
    }

    const amountToPay = invoice.balance || invoice.totalAmount;
    
    if (amountToPay <= 0) {
      return res.status(400).json({ message: 'No outstanding balance' });
    }

    // Get project info
    const project = await Project.findById(invoice.projectId);
    const projectName = project?.projectName || 'Solar Installation';

    // Determine payment methods
    const paymentMethods = paymentMethod === 'gcash' ? ['gcash'] : ['card'];

    // Create payment intent
    const paymentIntent = await PayMongoService.createPaymentIntent(
      amountToPay,
      `${invoice.invoiceType.toUpperCase()} Payment - ${invoice.invoiceNumber} - ${projectName}`,
      {
        type: 'invoice_payment',
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
        projectId: invoice.projectId?.toString(),
        projectName: projectName,
        clientId: client._id.toString(),
        clientName: `${client.contactFirstName} ${client.contactLastName}`
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
    console.error('Create invoice payment intent error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment intent', 
      error: error.message 
    });
  }
};

// ============ PROCESS CARD PAYMENT (Updated for Receipt Model) ============

// @desc    Process card payment (attach payment method and confirm)
// @route   POST /api/payments/process-card-payment
// @access  Private (Customer)
exports.processCardPayment = async (req, res) => {
  try {
    const { paymentIntentId, cardDetails } = req.body;
    const userId = req.user.id;

    console.log('Processing card payment for:', paymentIntentId);

    const client = await Client.findOne({ userId }).populate('userId');
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // First, try to find which payment type this belongs to
    let assessment = await PreAssessment.findOne({ 
      paymongoPaymentIntentId: paymentIntentId,
      clientId: client._id
    }).populate('clientId', 'contactFirstName contactLastName contactNumber userId')
      .populate('addressId');

    let invoice = null;
    let project = null;

    if (!assessment) {
      // Check if it's an invoice payment
      invoice = await SolarInvoice.findOne({
        paymongoPaymentIntentId: paymentIntentId,
        clientId: client._id
      });
      
      if (invoice) {
        project = await Project.findById(invoice.projectId);
      }
    }

    if (!assessment && !invoice) {
      return res.status(404).json({ message: 'Payment record not found' });
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
      
      // ============ HANDLE PRE-ASSESSMENT PAYMENT ============
      if (assessment) {
        assessment.paymentStatus = 'paid';
        assessment.assessmentStatus = 'scheduled';
        assessment.paymentMethod = 'card';
        assessment.paymentGateway = 'paymongo';
        assessment.autoVerified = true;
        assessment.paymentCompletedAt = new Date();
        assessment.confirmedAt = new Date();
        
        // Generate receipt for pre-assessment
        let receipt = null;
        try {
          const customerName = `${assessment.clientId.contactFirstName || ''} ${assessment.clientId.contactLastName || ''}`.trim();
          
          let addressString = '';
          if (assessment.addressId) {
            const addr = assessment.addressId;
            addressString = `${addr.houseOrBuilding || ''} ${addr.street || ''}, ${addr.barangay || ''}, ${addr.cityMunicipality || ''}`.trim();
          }
          
          receipt = await receiptService.generateReceipt({
            paymentType: 'pre_assessment',  // Valid enum value
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

          if (receipt && receipt.success) {
            assessment.receiptUrl = receipt.receiptUrl;
            assessment.receiptNumber = receipt.receiptNumber;
            console.log(`✅ Receipt generated for pre-assessment: ${receipt.receiptNumber}`);
          }
        } catch (receiptError) {
          console.error('Receipt generation error (non-blocking):', receiptError.message);
        }
        
        await assessment.save();

        return res.json({
          success: true,
          message: 'Payment successful',
          type: 'pre_assessment',
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
      
      // ============ HANDLE INVOICE PAYMENT (PROJECT BILL) ============
      if (invoice) {
        const paymentAmount = attachResult.amount || invoice.balance;
        
        // Add payment to invoice
        await invoice.addPayment({
          amount: paymentAmount,
          method: 'paymongo',  // Use 'paymongo' or add to enum
          reference: paymentIntentId,
          date: new Date(),
          notes: 'Online payment via PayMongo'
        });

        // ✅ MAP invoice type to receipt payment type enum
        let receiptPaymentType = 'full'; // Default fallback
        
        switch (invoice.invoiceType) {
          case 'initial':
            receiptPaymentType = 'initial';
            break;
          case 'progress':
            receiptPaymentType = 'progress';
            break;
          case 'final':
            receiptPaymentType = 'final';
            break;
          case 'full':
            receiptPaymentType = 'full';
            break;
          default:
            receiptPaymentType = 'additional';
        }
        
        // Generate receipt for invoice payment
        let receipt = null;
        try {
          const customerName = `${client.contactFirstName || ''} ${client.contactLastName || ''}`.trim();
          
          receipt = await receiptService.generateReceipt({
            paymentType: receiptPaymentType,  // ✅ Now uses valid enum: 'initial', 'progress', 'final', 'full', 'additional'
            amount: paymentAmount,
            paymentMethod: 'card',  // Use 'card' as it's in the enum
            referenceNumber: paymentIntentId,
            invoiceNumber: invoice.invoiceNumber,
            customer: {
              name: customerName,
              address: 'N/A',
              contact: client.contactNumber,
              email: client.userId?.email
            },
            projectName: project?.projectName || 'Solar Installation',
            verifiedBy: userId,
            verifiedAt: new Date(),
            notes: `Payment for ${invoice.invoiceType.toUpperCase()} - ${invoice.description}`,
            paymentDate: new Date()
          });

          if (receipt && receipt.success) {
            invoice.receiptUrl = receipt.receiptUrl;
            invoice.receiptNumber = receipt.receiptNumber;
            await invoice.save();
            console.log(`✅ Receipt generated for ${invoice.invoiceType} payment: ${receipt.receiptNumber}`);
          } else {
            console.log('Receipt generation returned:', receipt);
          }
        } catch (receiptError) {
          // Log error but don't block the payment success
          console.error('Receipt generation error (non-blocking):', receiptError.message);
        }
        
        // Update project if linked
        if (project) {
          // Update payment schedule
          const scheduleItem = project.paymentSchedule?.find(p => p.type === invoice.invoiceType);
          if (scheduleItem && scheduleItem.status !== 'paid') {
            scheduleItem.status = 'paid';
            scheduleItem.paidAt = new Date();
            scheduleItem.paymentReference = paymentIntentId;
            scheduleItem.paymentGateway = 'paymongo';
            
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
            
            await project.save();
            console.log(`✅ Project ${project.projectReference} updated: status=${project.status}, amountPaid=${project.amountPaid}`);
          }
        }

        return res.json({
          success: true,
          message: 'Payment successful',
          type: 'invoice_payment',
          receipt: receipt?.success ? {
            url: receipt.receiptUrl,
            number: receipt.receiptNumber
          } : null,
          data: {
            invoiceNumber: invoice.invoiceNumber,
            invoiceType: invoice.invoiceType,
            paymentStatus: invoice.paymentStatus,
            amountPaid: invoice.amountPaid,
            balance: invoice.balance,
            receiptUrl: invoice.receiptUrl,
            receiptNumber: invoice.receiptNumber,
            projectStatus: project?.status,
            projectId: project?._id
          }
        });
      }
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

    // Check pre-assessment first
    let assessment = await PreAssessment.findOne({ 
      paymongoPaymentIntentId: paymentIntentId,
      clientId: client._id
    });

    let invoice = null;

    if (!assessment) {
      // Check invoice payment
      invoice = await SolarInvoice.findOne({
        paymongoPaymentIntentId: paymentIntentId,
        clientId: client._id
      });
    }

    if (!assessment && !invoice) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // If already paid, return success
    if (assessment?.paymentStatus === 'paid' || invoice?.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        type: assessment ? 'pre_assessment' : 'invoice_payment',
        data: assessment ? {
          bookingReference: assessment.bookingReference,
          invoiceNumber: assessment.invoiceNumber
        } : {
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: invoice.invoiceType,
          paymentStatus: invoice.paymentStatus
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
      
      if (assessment) {
        assessment.paymentStatus = 'paid';
        assessment.assessmentStatus = 'scheduled';
        assessment.autoVerified = true;
        assessment.paymentMethod = paymentIntent.paymentMethod?.includes('gcash') ? 'gcash' : 'card';
        assessment.paymentGateway = 'paymongo';
        assessment.paymentCompletedAt = new Date();
        assessment.confirmedAt = new Date();
        
        if (paymentIntent.paymentDetails) {
          assessment.paymentReference = paymentIntent.paymentDetails.id;
        }
        
        await assessment.save();
      }
      
      if (invoice) {
        await invoice.addPayment({
          amount: paymentIntent.amount / 100,
          method: 'paymongo',
          reference: paymentIntentId,
          date: new Date(),
          notes: 'Payment verified via PayMongo'
        });
        
        // Update project if linked
        if (invoice.projectId) {
          const project = await Project.findById(invoice.projectId);
          if (project) {
            const scheduleItem = project.paymentSchedule?.find(p => p.type === invoice.invoiceType);
            if (scheduleItem && scheduleItem.status !== 'paid') {
              scheduleItem.status = 'paid';
              scheduleItem.paidAt = new Date();
              scheduleItem.paymentReference = paymentIntentId;
              scheduleItem.paymentGateway = 'paymongo';
              
              project.amountPaid = (project.amountPaid || 0) + (paymentIntent.amount / 100);
              project.balance = project.totalCost - project.amountPaid;
              
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
              
              await project.save();
            }
          }
        }
      }

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        type: assessment ? 'pre_assessment' : 'invoice_payment',
        data: assessment ? {
          bookingReference: assessment.bookingReference,
          invoiceNumber: assessment.invoiceNumber,
          paymentStatus: assessment.paymentStatus
        } : {
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: invoice.invoiceType,
          paymentStatus: invoice.paymentStatus,
          amountPaid: invoice.amountPaid,
          balance: invoice.balance
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