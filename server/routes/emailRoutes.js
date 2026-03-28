const express = require("express");
const axios = require("axios");

const router = express.Router();

// In-memory storage
const verificationCodes = new Map();

// Generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==================== EMAIL TEMPLATES ====================

// Base styles
const baseStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    .header {
      background: #2c3e50;
      padding: 30px;
      text-align: center;
      border-bottom: 3px solid #f39c12;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-weight: 400;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px;
    }
    .title {
      font-size: 24px;
      color: #2c3e50;
      margin: 0 0 10px 0;
      font-weight: 500;
    }
    .code-box {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .code {
      font-size: 32px;
      font-weight: 600;
      letter-spacing: 4px;
      color: #f39c12;
    }
    .text {
      color: #4a5568;
      line-height: 1.6;
      margin: 10px 0;
    }
    .text-small {
      color: #7f8c8d;
      font-size: 14px;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      color: #95a5a6;
      font-size: 12px;
      margin: 5px 0;
    }
    .info-box {
      background: #f8f9fa;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .success-box {
      background: #e8f5e9;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
      border-left: 4px solid #2ecc71;
    }
    .warning-box {
      background: #fff3e0;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
      border-left: 4px solid #f39c12;
    }
    .pending-box {
      background: #e3f2fd;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
      border-left: 4px solid #1976d2;
    }
  </style>
`;

// Verification Email Template
const verificationTemplate = (email, code) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Verification - SOLARIS</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Verify Your Email</h2>
      <p class="text">Hello,</p>
      <p class="text">Thank you for registering with SOLARIS. Please use the verification code below:</p>
      
      <div class="code-box">
        <div class="code">${code}</div>
      </div>
      
      <p class="text-small">This code expires in 10 minutes.</p>
      <p class="text-small">Email: ${email}</p>
      
      <p class="text-small" style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS. All rights reserved.</p>
      <p>IoT-Based Solar Site Pre-Assessment System</p>
    </div>
  </div>
</body>
</html>
`;

// Welcome Email Template
const welcomeTemplate = (name, email) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to SOLARIS</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Welcome to SOLARIS</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">Your account has been successfully created. Your email ${email} has been verified.</p>
      
      <div class="info-box">
        <p class="text" style="margin: 5px 0;"><strong>What you can do with SOLARIS:</strong></p>
        <p class="text" style="margin: 5px 0;">• Request Free Quotations</p>
        <p class="text" style="margin: 5px 0;">• Book Site Pre-Assessments</p>
        <p class="text" style="margin: 5px 0;">• Track Project Progress</p>
        <p class="text" style="margin: 5px 0;">• Monitor IoT Data</p>
        <p class="text" style="margin: 5px 0;">• Generate Assessment Reports</p>
      </div>
      
      <p class="text-small">You can now log in to access SOLARIS and start your solar journey.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS. All rights reserved.</p>
      <p>IoT-Based Solar Site Pre-Assessment System</p>
    </div>
  </div>
</body>
</html>
`;

// Forgot Password Template
const forgotPasswordTemplate = (email, code) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset - SOLARIS</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Reset Your Password</h2>
      <p class="text">Hello,</p>
      <p class="text">We received a request to reset your password. Use the code below:</p>
      
      <div class="code-box">
        <div class="code">${code}</div>
      </div>
      
      <p class="text-small">This code expires in 10 minutes.</p>
      <p class="text-small">Email: ${email}</p>
      
      <div class="info-box">
        <p class="text-small" style="margin: 5px 0;"><strong>How to reset:</strong></p>
        <p class="text-small" style="margin: 5px 0;">1. Enter the 6-digit code</p>
        <p class="text-small" style="margin: 5px 0;">2. Create a new password</p>
        <p class="text-small" style="margin: 5px 0;">3. Login with new credentials</p>
      </div>
      
      <p class="text-small">If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS. All rights reserved.</p>
      <p>IoT-Based Solar Site Pre-Assessment System</p>
    </div>
  </div>
</body>
</html>
`;

// Password Reset Success Template
const resetSuccessTemplate = (email) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset Successful - SOLARIS</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Password Reset Successful</h2>
      
      <div class="success-box">
        <p style="color: #2ecc71; font-size: 18px; margin: 0;">✓ Password Changed Successfully</p>
      </div>
      
      <p class="text">Hello,</p>
      <p class="text">Your password has been successfully reset for your SOLARIS account associated with ${email}.</p>
      <p class="text">You can now log in using your new password.</p>
      
      <p class="text-small" style="margin-top: 20px;">If you didn't make this change, please contact support immediately.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS. All rights reserved.</p>
      <p>IoT-Based Solar Site Pre-Assessment System</p>
    </div>
  </div>
</body>
</html>
`;

// Free Quotation Request Template
const freeQuoteTemplate = (name, quoteReference, monthlyBill, propertyType, desiredCapacity, address) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quotation Request Received - SOLARIS</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Quotation Request Received</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">Thank you for requesting a quotation from SOLARIS. Your request has been received and is now being processed.</p>
      
      <div class="info-box">
        <p class="text" style="margin: 5px 0;"><strong>Reference Number:</strong> ${quoteReference}</p>
        <p class="text" style="margin: 5px 0;"><strong>Monthly Bill:</strong> ₱${parseInt(monthlyBill).toLocaleString()}</p>
        <p class="text" style="margin: 5px 0;"><strong>Property Type:</strong> ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}</p>
        ${desiredCapacity ? `<p class="text" style="margin: 5px 0;"><strong>Desired Capacity:</strong> ${desiredCapacity}</p>` : ''}
        <p class="text" style="margin: 5px 0;"><strong>Address:</strong> ${address}</p>
      </div>
      
      <div class="success-box">
        <p class="text" style="margin: 5px 0;"><strong>What's Next?</strong></p>
        <p class="text" style="margin: 5px 0;">• Our team will review your request within 2-3 business days</p>
        <p class="text" style="margin: 5px 0;">• You'll receive a detailed quotation via email</p>
        <p class="text" style="margin: 5px 0;">• Our engineer may contact you for additional information</p>
      </div>
      
      <p class="text-small">If you have any questions, please don't hesitate to contact our support team.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS. All rights reserved.</p>
      <p>IoT-Based Solar Site Pre-Assessment System</p>
    </div>
  </div>
</body>
</html>
`;

// Pre-Assessment Booking Template
const preAssessmentTemplate = (name, invoiceNumber, amount, propertyType, desiredCapacity, roofType, preferredDate, address) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pre-Assessment Booking Confirmation - SOLARIS</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Pre-Assessment Booking Confirmation</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">Your pre-assessment booking has been created successfully. Please complete the payment to schedule your assessment.</p>
      
      <div class="info-box">
        <p class="text" style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p class="text" style="margin: 5px 0;"><strong>Amount Due:</strong> ₱${parseInt(amount).toLocaleString()}</p>
        <p class="text" style="margin: 5px 0;"><strong>Property Type:</strong> ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}</p>
        ${desiredCapacity ? `<p class="text" style="margin: 5px 0;"><strong>Desired Capacity:</strong> ${desiredCapacity}</p>` : ''}
        ${roofType ? `<p class="text" style="margin: 5px 0;"><strong>Roof Type:</strong> ${roofType.charAt(0).toUpperCase() + roofType.slice(1)}</p>` : ''}
        <p class="text" style="margin: 5px 0;"><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p class="text" style="margin: 5px 0;"><strong>Address:</strong> ${address}</p>
      </div>
      
      <div class="warning-box">
        <p class="text" style="margin: 5px 0;"><strong>Payment Instructions:</strong></p>
        <p class="text" style="margin: 5px 0;">1. Log in to your SOLARIS account</p>
        <p class="text" style="margin: 5px 0;">2. Go to Billing section</p>
        <p class="text" style="margin: 5px 0;">3. Complete the payment for invoice ${invoiceNumber}</p>
        <p class="text" style="margin: 5px 0;">4. Once payment is confirmed, we'll schedule your assessment</p>
      </div>
      
      <div class="success-box">
        <p class="text" style="margin: 5px 0;"><strong>What's Included:</strong></p>
        <p class="text" style="margin: 5px 0;">✓ On-site visit with monitoring device</p>
        <p class="text" style="margin: 5px 0;">✓ 7-day actual environmental data collection</p>
        <p class="text" style="margin: 5px 0;">✓ Accurate system size recommendation</p>
        <p class="text" style="margin: 5px 0;">✓ Detailed assessment report</p>
        <p class="text" style="margin: 5px 0;">✓ Professional engineer consultation</p>
      </div>
      
      <p class="text-small">Your booking will be confirmed once payment is received. Please complete the payment to secure your preferred date.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS. All rights reserved.</p>
      <p>IoT-Based Solar Site Pre-Assessment System</p>
    </div>
  </div>
</body>
</html>
`;

// Payment Submission Confirmation Template
const paymentSubmissionTemplate = (name, invoiceNumber, amount, referenceNumber, propertyType, preferredDate) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Received - SOLARIS</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Payment Received - Pending Verification</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">We have received your payment submission for your pre-assessment booking. Our team is now verifying your payment.</p>
      
      <div class="pending-box">
        <p class="text" style="margin: 5px 0;"><strong>Payment Details:</strong></p>
        <p class="text" style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p class="text" style="margin: 5px 0;"><strong>Amount:</strong> ₱${parseInt(amount).toLocaleString()}</p>
        <p class="text" style="margin: 5px 0;"><strong>Reference Number:</strong> ${referenceNumber}</p>
        <p class="text" style="margin: 5px 0;"><strong>Property Type:</strong> ${propertyType}</p>
        <p class="text" style="margin: 5px 0;"><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      
      <div class="warning-box">
        <p class="text" style="margin: 5px 0;"><strong>What's Next?</strong></p>
        <p class="text" style="margin: 5px 0;">• Our team will verify your payment within 24-48 hours</p>
        <p class="text" style="margin: 5px 0;">• You will receive a confirmation email once payment is verified</p>
        <p class="text" style="margin: 5px 0;">• Your assessment schedule will be confirmed after verification</p>
        <p class="text" style="margin: 5px 0;">• If any issues, our team will contact you</p>
      </div>
      
      <div class="info-box">
        <p class="text" style="margin: 5px 0;"><strong>Important Notes:</strong></p>
        <p class="text" style="margin: 5px 0;">• Please keep your reference number for tracking</p>
        <p class="text" style="margin: 5px 0;">• Check your email for verification status updates</p>
        <p class="text" style="margin: 5px 0;">• You can track payment status in your dashboard</p>
      </div>
      
      <p class="text-small">Thank you for choosing SOLARIS. We'll notify you once your payment is verified.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS. All rights reserved.</p>
      <p>IoT-Based Solar Site Pre-Assessment System</p>
    </div>
  </div>
</body>
</html>
`;

// Payment Verified Confirmation Template
const paymentVerifiedTemplate = (name, invoiceNumber, amount, propertyType, preferredDate) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Verified - SOLARIS</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Payment Verified - Assessment Confirmed</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">Great news! Your payment has been verified and your pre-assessment is now confirmed.</p>
      
      <div class="success-box">
        <p class="text" style="margin: 5px 0;"><strong>✓ Payment Verified</strong></p>
        <p class="text" style="margin: 5px 0;"><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p class="text" style="margin: 5px 0;"><strong>Amount:</strong> ₱${parseInt(amount).toLocaleString()}</p>
        <p class="text" style="margin: 5px 0;"><strong>Status:</strong> Paid & Verified</p>
      </div>
      
      <div class="info-box">
        <p class="text" style="margin: 5px 0;"><strong>Assessment Details:</strong></p>
        <p class="text" style="margin: 5px 0;"><strong>Property Type:</strong> ${propertyType}</p>
        <p class="text" style="margin: 5px 0;"><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      
      <div class="success-box">
        <p class="text" style="margin: 5px 0;"><strong>What's Next?</strong></p>
        <p class="text" style="margin: 5px 0;">• Our team will contact you to confirm the exact schedule</p>
        <p class="text" style="margin: 5px 0;">• An engineer will be assigned to your assessment</p>
        <p class="text" style="margin: 5px 0;">• Prepare your site for the assessment visit</p>
        <p class="text" style="margin: 5px 0;">• You'll receive reminders before the assessment date</p>
      </div>
      
      <p class="text-small">Thank you for your payment. We look forward to helping you with your solar journey!</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS. All rights reserved.</p>
      <p>IoT-Based Solar Site Pre-Assessment System</p>
    </div>
  </div>
</body>
</html>
`;

// ==================== EMAIL ENDPOINTS ====================

/*
=========================
SEND VERIFICATION EMAIL
=========================
*/
router.post("/send-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const code = generateCode();
    verificationCodes.set(email, { code, timestamp: Date.now(), type: 'verification' });

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "SOLARIS" },
      to: [{ email }],
      subject: "Verify your email address - SOLARIS",
      htmlContent: verificationTemplate(email, code)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Verification code sent" });
  } catch (error) {
    console.error("Email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

/*
=========================
SEND PASSWORD RESET CODE
=========================
*/
router.post("/send-reset-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const code = generateCode();
    verificationCodes.set(email, { code, timestamp: Date.now(), type: 'reset' });

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "SOLARIS" },
      to: [{ email }],
      subject: "Password reset code - SOLARIS",
      htmlContent: forgotPasswordTemplate(email, code)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Reset code sent" });
  } catch (error) {
    console.error("Email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send reset code" });
  }
});

/*
=========================
VERIFY CODE
=========================
*/
router.post("/verify-code", (req, res) => {
  try {
    const email = req.body.email?.toLowerCase();
    const { code } = req.body;

    const stored = verificationCodes.get(email);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: "No code found"
      });
    }

    if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Code expired"
      });
    }

    if (stored.code !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid code"
      });
    }

    verificationCodes.delete(email);

    res.json({
      success: true,
      message: "Code verified"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Verification failed"
    });
  }
});

/*
=========================
SEND WELCOME EMAIL
=========================
*/
router.post("/send-welcome", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ success: false, message: "Email and name required" });

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "SOLARIS" },
      to: [{ email }],
      subject: "Welcome to SOLARIS",
      htmlContent: welcomeTemplate(name, email)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Welcome email sent" });
  } catch (error) {
    console.error("Welcome email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send welcome email" });
  }
});

/*
=========================
SEND RESET SUCCESS EMAIL
=========================
*/
router.post("/send-reset-success", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "SOLARIS" },
      to: [{ email }],
      subject: "Password reset successful - SOLARIS",
      htmlContent: resetSuccessTemplate(email)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Reset success email sent" });
  } catch (error) {
    console.error("Reset success email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send reset success email" });
  }
});

/*
=========================
SEND FREE QUOTE CONFIRMATION EMAIL
=========================
*/
router.post("/send-free-quote-confirmation", async (req, res) => {
  try {
    const { email, name, quoteReference, monthlyBill, propertyType, desiredCapacity, address } = req.body;
    
    if (!email || !name || !quoteReference) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "SOLARIS" },
      to: [{ email }],
      subject: `Quotation Request Received - ${quoteReference}`,
      htmlContent: freeQuoteTemplate(name, quoteReference, monthlyBill, propertyType, desiredCapacity, address)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Quote confirmation email sent" });
  } catch (error) {
    console.error("Quote email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send quote confirmation email" });
  }
});

/*
=========================
SEND PRE-ASSESSMENT CONFIRMATION EMAIL
=========================
*/
router.post("/send-pre-assessment-confirmation", async (req, res) => {
  try {
    const { email, name, invoiceNumber, amount, propertyType, desiredCapacity, roofType, preferredDate, address } = req.body;
    
    if (!email || !name || !invoiceNumber) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "SOLARIS" },
      to: [{ email }],
      subject: `Pre-Assessment Booking Confirmation - ${invoiceNumber}`,
      htmlContent: preAssessmentTemplate(name, invoiceNumber, amount, propertyType, desiredCapacity, roofType, preferredDate, address)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Pre-assessment confirmation email sent" });
  } catch (error) {
    console.error("Pre-assessment email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send pre-assessment confirmation email" });
  }
});

/*
=========================
SEND PAYMENT SUBMISSION CONFIRMATION EMAIL
=========================
*/
router.post("/send-payment-confirmation", async (req, res) => {
  try {
    const { email, name, invoiceNumber, amount, referenceNumber, propertyType, preferredDate } = req.body;
    
    if (!email || !name || !invoiceNumber) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "SOLARIS" },
      to: [{ email }],
      subject: `Payment Received - Pending Verification - ${invoiceNumber}`,
      htmlContent: paymentSubmissionTemplate(name, invoiceNumber, amount, referenceNumber, propertyType, preferredDate)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Payment confirmation email sent" });
  } catch (error) {
    console.error("Payment confirmation email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send payment confirmation email" });
  }
});

/*
=========================
SEND PAYMENT VERIFIED EMAIL
=========================
*/
router.post("/send-payment-verified", async (req, res) => {
  try {
    const { email, name, invoiceNumber, amount, propertyType, preferredDate } = req.body;
    
    if (!email || !name || !invoiceNumber) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "SOLARIS" },
      to: [{ email }],
      subject: `Payment Verified - Assessment Confirmed - ${invoiceNumber}`,
      htmlContent: paymentVerifiedTemplate(name, invoiceNumber, amount, propertyType, preferredDate)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Payment verified email sent" });
  } catch (error) {
    console.error("Payment verified email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send payment verified email" });
  }
});

module.exports = router;