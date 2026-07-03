// controllers/paymentsController.js
const PayMongoService = require('../services/paymongoService');
const PreAssessment = require('../models/PreAssessment');
const Project = require('../models/Project');
const Client = require('../models/Clients');
const SolarInvoice = require('../models/SolarInvoice');
const receiptService = require('../services/receiptService');

// =============================================
// PRE-ASSESSMENT PAYMENT INTENT
// =============================================

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
// controllers/paymentController.js

// =============================================
// BANK TRANSFER PAYMENT INTENT - COMPLETE
// =============================================

// @desc    Create bank transfer payment intent (DOB only - BPI/UnionBank)
// @route   POST /api/payments/bank-transfer/:invoiceId/create-intent
// @access  Private (Customer)
exports.createBankTransferPaymentIntent = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;
    const { bankCode, provider } = req.body;

    console.log('Creating bank transfer payment intent:', { invoiceId, bankCode, provider });

    // =============================================
    // VALIDATE PROVIDER
    // =============================================
    // Only DOB is available (BPI, UnionBank)
    // Brankas (BDO, Metrobank, Landbank) is not enabled
    if (provider === 'brankas') {
      return res.status(400).json({
        success: false,
        message: 'Brankas (BDO, Metrobank, Landbank) is not enabled. Please use DOB (BPI or UnionBank).',
        availableProviders: ['dob'],
        suggestion: 'Use provider: "dob" with bankCode: "bpi" or "ubp"'
      });
    }

    if (!provider || provider !== 'dob') {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider. Only "dob" is available.',
        availableProviders: ['dob']
      });
    }

    // Validate bank code for DOB
    const validDobBanks = ['bpi', 'ubp'];
    if (!validDobBanks.includes(bankCode)) {
      return res.status(400).json({
        success: false,
        message: `Invalid bank code for DOB. Valid: ${validDobBanks.join(', ')}`,
        validBanks: validDobBanks
      });
    }

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

    // =============================================
// STEP 1: Create Payment Intent with DOB
// =============================================
const paymentIntent = await PayMongoService.createPaymentIntent(
  amountToPay,
  `${invoice.invoiceType.toUpperCase()} Payment - ${invoice.invoiceNumber}`,
  { invoiceId: invoice._id.toString() },
  ['dob']
);

if (!paymentIntent.success) {
  return res.status(500).json({ success: false, message: paymentIntent.error });
}

// =============================================
// STEP 2 & 3: CRITICAL OPTIMIZATION
// Execute the creation and attachment simultaneously or back-to-back 
// BEFORE doing any heavy database saves or logging.
// =============================================
const paymentMethodResult = await PayMongoService.createDOBPaymentMethod(
  bankCode, 
  {
    name: `${client.contactFirstName} ${client.contactLastName}`,
    email: client.userId?.email || 'customer@example.com',
    phone: client.contactNumber || ''
  }
);

if (!paymentMethodResult.success) {
  return res.status(500).json({ success: false, message: paymentMethodResult.error });
}

// Attach immediately without waiting for anything else
const attachResult = await PayMongoService.attachPaymentMethodWithRedirect(
  paymentIntent.paymentIntentId,
  paymentMethodResult.paymentMethodId,
  paymentIntent.clientSecret,
  `${process.env.FRONTEND_URL}/app/customer/payment-success`
);

if (!attachResult.success) {
  return res.status(500).json({ success: false, message: attachResult.error });
}

// =============================================
// STEP 4: Save to Database (MOVE THIS TO THE END)
// Moving this here ensures database write-latency doesn't delay your API response
// =============================================
invoice.paymongoPaymentIntentId = paymentIntent.paymentIntentId;
invoice.paymentMethod = 'dob';
invoice.paymentGateway = 'paymongo';
await invoice.save(); 

// =============================================
// STEP 5: Return Response Immediately
// =============================================
return res.json({
  success: true,
  redirectUrl: attachResult.redirectUrl, // Hand this off to window.location.href immediately
  status: attachResult.status
});

  } catch (error) {
    console.error('Create bank transfer payment intent error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create bank transfer payment', 
      error: error.message 
    });
  }
};
// =============================================
// INVOICE PAYMENT INTENT
// =============================================

// =============================================
// INVOICE PAYMENT INTENT - UPDATED
// =============================================

// controllers/paymentController.js

// =============================================
// INVOICE PAYMENT INTENT - COMPLETE
// =============================================

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

    // =============================================
    // 1. HANDLE GCASH
    // =============================================
    if (paymentMethod === 'gcash') {
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
          clientName: `${client.contactFirstName} ${client.contactLastName}`,
          paymentMethod: 'gcash'
        },
        ['gcash']
      );

      if (!paymentIntent.success) {
        return res.status(500).json({ message: paymentIntent.error });
      }

      invoice.paymongoPaymentIntentId = paymentIntent.paymentIntentId;
      await invoice.save();

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
        type: 'redirect',
        paymentMethod: 'gcash'
      });
    }

    // =============================================
    // 2. HANDLE DOB (BPI, UnionBank) - AVAILABLE NOW
    // =============================================
    if (paymentMethod === 'dob') {
      const bankCode = req.body.bankCode || 'bpi'; // Default to BPI
      
      // Step 1: Create Payment Intent with DOB allowed
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
          clientName: `${client.contactFirstName} ${client.contactLastName}`,
          paymentMethod: 'dob'
        },
        ['dob'] // Only allow DOB
      );

      if (!paymentIntent.success) {
        return res.status(500).json({ message: paymentIntent.error });
      }

      // Step 2: Create DOB Payment Method
      const paymentMethodResult = await PayMongoService.createDOBPaymentMethod(
        bankCode, // 'bpi' or 'ubp'
        {
          name: `${client.contactFirstName} ${client.contactLastName}`,
          email: client.userId?.email || 'customer@example.com'
        }
      );

      if (!paymentMethodResult.success) {
        return res.status(500).json({ message: paymentMethodResult.error });
      }

      // Step 3: Attach Payment Method
      const attachResult = await PayMongoService.attachPaymentMethodWithRedirect(
        paymentIntent.paymentIntentId,
        paymentMethodResult.paymentMethodId,
        paymentIntent.clientSecret,
        `${process.env.FRONTEND_URL}/app/customer/payment-success`
      );

      if (!attachResult.success) {
        return res.status(500).json({ message: attachResult.error });
      }

      // Store payment intent ID on invoice
      invoice.paymongoPaymentIntentId = paymentIntent.paymentIntentId;
      invoice.paymentMethod = 'dob';
      invoice.paymentGateway = 'paymongo';
      await invoice.save();

      // Get bank name
      const bankNames = {
        bpi: 'BPI',
        ubp: 'UnionBank'
      };

      return res.json({
        success: true,
        redirectUrl: attachResult.redirectUrl,
        paymentIntentId: paymentIntent.paymentIntentId,
        status: attachResult.status,
        type: 'redirect',
        paymentMethod: 'dob',
        bankCode: bankCode,
        bankName: bankNames[bankCode] || bankCode,
        message: `Redirecting to ${bankNames[bankCode] || bankCode} online banking portal`
      });
    }

    // =============================================
    // 3. HANDLE BRANKAS (BDO, Metrobank, Landbank) - NOT AVAILABLE YET
    // =============================================
    if (paymentMethod === 'brankas') {
      // Brankas is not enabled for your account yet
      // Return a helpful message
      return res.status(400).json({
        success: false,
        message: 'Brankas (BDO, Metrobank, Landbank) is not enabled for your account yet. Please use BPI or UnionBank via DOB instead.',
        availableMethods: ['gcash', 'card', 'dob'],
        suggestion: 'Use "dob" with bankCode "bpi" or "ubp"'
      });
    }

    // =============================================
    // 4. HANDLE CARD (Default)
    // =============================================
    // Create payment intent for card
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
        clientName: `${client.contactFirstName} ${client.contactLastName}`,
        paymentMethod: 'card'
      },
      ['card']
    );

    if (!paymentIntent.success) {
      return res.status(500).json({ message: paymentIntent.error });
    }

    // Store payment intent ID on invoice
    invoice.paymongoPaymentIntentId = paymentIntent.paymentIntentId;
    await invoice.save();

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

// =============================================
// BANK TRANSFER (BRANKAS) PAYMENT SOURCE
// =============================================

// @desc    Create Brankas payment source for bank transfer
// @route   POST /api/payments/create-brankas-source
// @access  Private (Customer)
exports.createBrankasPaymentSource = async (req, res) => {
  try {
    const { paymentIntentId, amount, description, clientId, clientName, clientEmail } = req.body;
    const userId = req.user.id;

    console.log('Creating Brankas payment source for:', paymentIntentId);

    // Verify client
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Verify the payment intent exists and belongs to this client
    let assessment = await PreAssessment.findOne({
      paymongoPaymentIntentId: paymentIntentId,
      clientId: client._id
    });

    let invoice = null;
    if (!assessment) {
      invoice = await SolarInvoice.findOne({
        paymongoPaymentIntentId: paymentIntentId,
        clientId: client._id
      });
    }

    if (!assessment && !invoice) {
      return res.status(404).json({ message: 'Payment intent not found' });
    }

    // Get the amount to pay
    const amountToPay = amount || assessment?.assessmentFee || invoice?.balance || invoice?.totalAmount;

    // Get description
    const desc = description || 
                 assessment?.bookingReference || 
                 invoice?.invoiceNumber || 
                 'Solar Installation Payment';

    // Create Brankas payment source (Direct Online Banking)
    const brankasResult = await PayMongoService.createBrankasPaymentSource(
      paymentIntentId,
      amountToPay,
      desc,
      {
        name: clientName || `${client.contactFirstName} ${client.contactLastName}`,
        email: clientEmail || client.userId?.email,
        phone: client.contactNumber
      }
    );

    if (!brankasResult.success) {
      console.error('Brankas payment source creation failed:', brankasResult.error);
      return res.status(500).json({ 
        success: false, 
        message: brankasResult.error || 'Failed to create bank transfer payment' 
      });
    }

    // Store the payment source reference
    if (assessment) {
      assessment.paymentMethod = 'bank_transfer';
      assessment.paymentGateway = 'paymongo';
      await assessment.save();
    } else if (invoice) {
      invoice.paymentMethod = 'bank_transfer';
      invoice.paymentGateway = 'paymongo';
      await invoice.save();
    }

    console.log('✅ Brankas payment source created:', brankasResult);

    return res.json({
      success: true,
      redirectUrl: brankasResult.redirectUrl,
      paymentIntentId: paymentIntentId,
      type: 'redirect',
      paymentMethod: 'bank_transfer',
      message: 'Bank transfer payment initiated. Please complete the payment on the bank page.'
    });

  } catch (error) {
    console.error('Create Brankas payment source error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create bank transfer payment', 
      error: error.message 
    });
  }
};

// =============================================
// PROCESS CARD PAYMENT
// =============================================

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
          method: 'paymongo',
          reference: paymentIntentId,
          date: new Date(),
          notes: 'Online payment via PayMongo'
        });

        // MAP invoice type to receipt payment type enum
        let receiptPaymentType = 'full';
        switch (invoice.invoiceType) {
          case 'initial': receiptPaymentType = 'initial'; break;
          case 'progress': receiptPaymentType = 'progress'; break;
          case 'final': receiptPaymentType = 'final'; break;
          case 'full': receiptPaymentType = 'full'; break;
          default: receiptPaymentType = 'additional';
        }
        
        // Generate receipt for invoice payment
        let receipt = null;
        try {
          const customerName = `${client.contactFirstName || ''} ${client.contactLastName || ''}`.trim();
          
          receipt = await receiptService.generateReceipt({
            paymentType: receiptPaymentType,
            amount: paymentAmount,
            paymentMethod: 'card',
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
          }
        } catch (receiptError) {
          console.error('Receipt generation error (non-blocking):', receiptError.message);
        }
        
        // Update project if linked
        if (project) {
          const scheduleItem = project.paymentSchedule?.find(p => p.type === invoice.invoiceType);
          if (scheduleItem && scheduleItem.status !== 'paid') {
            scheduleItem.status = 'paid';
            scheduleItem.paidAt = new Date();
            scheduleItem.paymentReference = paymentIntentId;
            scheduleItem.paymentGateway = 'paymongo';
            
            project.amountPaid = (project.amountPaid || 0) + paymentAmount;
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

// =============================================
// VERIFY PAYMENT
// =============================================

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

// =============================================
// GET PAYMENT STATUS
// =============================================

// @desc    Get payment status for an intent
// @route   GET /api/payments/status/:paymentIntentId
// @access  Private (Customer)
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.user.id;

    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check local records first
    let assessment = await PreAssessment.findOne({
      paymongoPaymentIntentId: paymentIntentId,
      clientId: client._id
    });

    let invoice = null;
    if (!assessment) {
      invoice = await SolarInvoice.findOne({
        paymongoPaymentIntentId: paymentIntentId,
        clientId: client._id
      });
    }

    // If already paid locally, return success
    if (assessment?.paymentStatus === 'paid') {
      return res.json({
        success: true,
        status: 'succeeded',
        isPaid: true,
        type: 'pre_assessment',
        data: {
          bookingReference: assessment.bookingReference,
          invoiceNumber: assessment.invoiceNumber,
          receiptUrl: assessment.receiptUrl
        }
      });
    }

    if (invoice?.paymentStatus === 'paid') {
      return res.json({
        success: true,
        status: 'succeeded',
        isPaid: true,
        type: 'invoice_payment',
        data: {
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: invoice.invoiceType,
          receiptUrl: invoice.receiptUrl
        }
      });
    }

    // Check with PayMongo API
    const paymentIntent = await PayMongoService.getPaymentIntent(paymentIntentId);

    if (!paymentIntent.success) {
      return res.status(500).json({ 
        success: false, 
        message: paymentIntent.error 
      });
    }

    // Determine if this is a bank transfer (Brankas) payment
    const isBankTransfer = paymentIntent.paymentMethodType === 'brankas' ||
                          paymentIntent.paymentMethodType === 'direct_debit';

    return res.json({
      success: true,
      status: paymentIntent.status,
      isPaid: paymentIntent.isPaid || paymentIntent.status === 'succeeded',
      amount: paymentIntent.amount,
      paymentMethodType: paymentIntent.paymentMethodType,
      isBankTransfer: isBankTransfer,
      redirectUrl: paymentIntent.nextAction?.redirect?.url || null,
      data: {
        type: assessment ? 'pre_assessment' : 'invoice_payment',
        reference: assessment?.bookingReference || invoice?.invoiceNumber
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get payment status', 
      error: error.message 
    });
  }
};

// =============================================
// GET SUPPORTED BANKS
// =============================================

// @desc    Get supported banks for bank transfer
// @route   GET /api/payments/supported-banks
// @access  Private (Customer)
exports.getSupportedBanks = async (req, res) => {
  try {
    // This list is based on PayMongo's Brankas supported banks
    const banks = [
      { id: 'bdo', name: 'BDO Unibank', code: 'BDO' },
      { id: 'bpi', name: 'Bank of the Philippine Islands', code: 'BPI' },
      { id: 'landbank', name: 'Land Bank of the Philippines', code: 'LANDBANK' },
      { id: 'metrobank', name: 'Metrobank', code: 'MBTC' },
      { id: 'unionbank', name: 'UnionBank of the Philippines', code: 'UBP' },
      { id: 'security_bank', name: 'Security Bank', code: 'SECB' },
      { id: 'chinabank', name: 'China Bank', code: 'CBC' },
      { id: 'pnb', name: 'Philippine National Bank', code: 'PNB' },
      { id: 'eastwest', name: 'EastWest Bank', code: 'EWB' },
      { id: 'rcbc', name: 'RCBC', code: 'RCBC' },
    ];

    res.json({
      success: true,
      banks: banks,
      message: 'Supported banks for online banking transfer'
    });

  } catch (error) {
    console.error('Get supported banks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get supported banks', 
      error: error.message 
    });
  }
};

// =============================================
// PAYMONGO WEBHOOK
// =============================================

// @desc    Handle PayMongo webhook events (Brankas, GCash, Card)
// @route   POST /api/payments/webhook
// @access  Public (No auth needed)
exports.handlePayMongoWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log('📨 Webhook received:', event.type);

    const eventData = event.data;
    const paymentIntentId = eventData?.attributes?.payment_intent_id || 
                           eventData?.attributes?.data?.id ||
                           eventData?.id;

    if (!paymentIntentId) {
      console.log('⚠️ No payment intent ID in webhook');
      return res.status(200).json({ received: true });
    }

    console.log('Processing webhook for payment intent:', paymentIntentId);

    // Find the payment record
    let assessment = await PreAssessment.findOne({ paymongoPaymentIntentId: paymentIntentId });
    let invoice = null;

    if (!assessment) {
      invoice = await SolarInvoice.findOne({ paymongoPaymentIntentId: paymentIntentId });
    }

    if (!assessment && !invoice) {
      console.log('⚠️ Payment record not found for intent:', paymentIntentId);
      return res.status(200).json({ received: true });
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.payment_method_attached':
        console.log('Payment method attached for:', paymentIntentId);
        break;

      case 'payment_intent.succeeded':
        console.log('✅ Payment succeeded for:', paymentIntentId);
        await handleSuccessfulPayment(assessment, invoice, eventData);
        break;

      case 'payment_intent.failed':
        console.log('❌ Payment failed for:', paymentIntentId);
        await handleFailedPayment(assessment, invoice, eventData);
        break;

      case 'payment_intent.cancelled':
        console.log('⚠️ Payment cancelled for:', paymentIntentId);
        await handleCancelledPayment(assessment, invoice);
        break;

      case 'payment_intent.payment_source_assigned':
        console.log('Payment source assigned:', paymentIntentId);
        break;

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(200).json({ received: true });
  }
};

// =============================================
// WEBHOOK HELPER FUNCTIONS
// =============================================

async function handleSuccessfulPayment(assessment, invoice, eventData) {
  const amount = eventData?.attributes?.amount ? eventData.attributes.amount / 100 : 0;
  const paymentMethod = eventData?.attributes?.payment_method_type || 'bank_transfer';

  if (assessment) {
    assessment.paymentStatus = 'paid';
    assessment.assessmentStatus = 'scheduled';
    assessment.autoVerified = true;
    assessment.paymentMethod = paymentMethod;
    assessment.paymentGateway = 'paymongo';
    assessment.paymentCompletedAt = new Date();
    assessment.confirmedAt = new Date();
    assessment.paymentReference = eventData?.attributes?.payment_method_id || 'webhook';

    // Generate receipt
    try {
      const client = await Client.findById(assessment.clientId);
      const receipt = await receiptService.generateReceipt({
        paymentType: 'pre_assessment',
        amount: assessment.assessmentFee,
        paymentMethod: paymentMethod,
        referenceNumber: assessment.paymongoPaymentIntentId,
        invoiceNumber: assessment.invoiceNumber,
        customer: {
          name: `${client.contactFirstName} ${client.contactLastName}`,
          contact: client.contactNumber,
          email: client.userId?.email
        },
        verifiedBy: assessment._id,
        verifiedAt: new Date(),
        notes: `Payment via ${paymentMethod} - Webhook verified`,
        paymentDate: new Date()
      });

      if (receipt?.success) {
        assessment.receiptUrl = receipt.receiptUrl;
        assessment.receiptNumber = receipt.receiptNumber;
      }
    } catch (err) {
      console.error('Receipt generation error:', err);
    }

    await assessment.save();
    console.log(`✅ Pre-assessment ${assessment.bookingReference} marked as paid via webhook`);
  }

  if (invoice) {
    await invoice.addPayment({
      amount: amount,
      method: paymentMethod,
      reference: invoice.paymongoPaymentIntentId,
      date: new Date(),
      notes: `Payment via ${paymentMethod} - Webhook verified`
    });

    if (invoice.projectId) {
      const project = await Project.findById(invoice.projectId);
      if (project) {
        const scheduleItem = project.paymentSchedule?.find(p => p.type === invoice.invoiceType);
        if (scheduleItem && scheduleItem.status !== 'paid') {
          scheduleItem.status = 'paid';
          scheduleItem.paidAt = new Date();
          scheduleItem.paymentReference = invoice.paymongoPaymentIntentId;
          scheduleItem.paymentGateway = 'paymongo';
          
          project.amountPaid = (project.amountPaid || 0) + amount;
          project.balance = project.totalCost - project.amountPaid;

          if (invoice.invoiceType === 'initial' && project.status === 'approved') {
            project.status = 'initial_paid';
          } else if (invoice.invoiceType === 'progress' && project.status === 'in_progress') {
            project.status = 'progress_paid';
          } else if (invoice.invoiceType === 'full' || project.amountPaid >= project.totalCost) {
            project.status = 'full_paid';
            project.fullPaymentCompleted = true;
          }

          await project.save();
        }
      }
    }
    console.log(`✅ Invoice ${invoice.invoiceNumber} marked as paid via webhook`);
  }
}

async function handleFailedPayment(assessment, invoice, eventData) {
  const errorMessage = eventData?.attributes?.last_payment_error?.message || 'Payment failed';

  if (assessment) {
    assessment.paymentStatus = 'failed';
    assessment.paymentError = errorMessage;
    await assessment.save();
    console.log(`❌ Pre-assessment payment failed: ${errorMessage}`);
  }

  if (invoice) {
    invoice.paymentStatus = 'failed';
    invoice.status = 'cancelled';
    invoice.adminRemarks = `Payment failed: ${errorMessage}`;
    await invoice.save();
    console.log(`❌ Invoice ${invoice.invoiceNumber} payment failed: ${errorMessage}`);
  }
}

async function handleCancelledPayment(assessment, invoice) {
  if (assessment) {
    assessment.paymentStatus = 'cancelled';
    assessment.assessmentStatus = 'pending_payment';
    await assessment.save();
    console.log(`⚠️ Pre-assessment payment cancelled`);
  }

  if (invoice) {
    invoice.paymentStatus = 'pending';
    invoice.status = 'pending';
    await invoice.save();
    console.log(`⚠️ Invoice ${invoice.invoiceNumber} payment cancelled`);
  }
}

// =============================================
// GET TEST CARD
// =============================================

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