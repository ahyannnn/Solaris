const express = require("express");
const axios = require("axios");

const router = express.Router();

// In-memory storage
const verificationCodes = new Map();

// Generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==================== CLOUDINARY LOGO URL ====================
const CLOUDINARY_LOGO = "https://res.cloudinary.com/dz9x2kpar/image/upload/v1774690308/solar-tps/payment-proofs/payment_PA-260327-629_1774690307311.png";

// ==================== MINIMALISTIC EMAIL TEMPLATES ====================

// Base styles - Black & Orange theme
const baseStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e0e0e0;
    }
    .header {
      background: #000000;
      padding: 32px 24px;
      text-align: center;
      border-bottom: 2px solid #ff6b00;
    }
    .header-logo {
      max-width: 60px;
      height: auto;
      margin-bottom: 12px;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 32px 28px;
    }
    .title {
      font-size: 22px;
      color: #000000;
      margin: 0 0 12px 0;
      font-weight: 500;
    }
    .code-box {
      background: #f8f8f8;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .code {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 3px;
      color: #ff6b00;
    }
    .text {
      color: #333333;
      line-height: 1.5;
      margin: 8px 0;
      font-size: 15px;
    }
    .text-small {
      color: #666666;
      font-size: 13px;
      line-height: 1.4;
    }
    .footer {
      background: #fafafa;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      color: #888888;
      font-size: 11px;
      margin: 4px 0;
    }
    .info-box {
      background: #f8f8f8;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .info-box p {
      margin: 6px 0;
      font-size: 14px;
      color: #333;
    }
    .success-box {
      background: #fef5e8;
      padding: 16px 20px;
      margin: 20px 0;
      border-left: 3px solid #ff6b00;
    }
    .warning-box {
      background: #fff8f0;
      padding: 16px 20px;
      margin: 20px 0;
      border-left: 3px solid #ff6b00;
    }
    .pending-box {
      background: #fef5e8;
      padding: 16px 20px;
      margin: 20px 0;
      border-left: 3px solid #ff6b00;
    }
    hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 20px 0;
    }
    .divider {
      height: 1px;
      background: #e0e0e0;
      margin: 20px 0;
    }
  </style>
`;

// Verification Email Template
const verificationTemplate = (email, code) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Verification</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${CLOUDINARY_LOGO}" alt="SOLARIS" class="header-logo" />
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Verify your email</h2>
      <p class="text">Hello,</p>
      <p class="text">Use the code below to verify your email address.</p>
      
      <div class="code-box">
        <div class="code">${code}</div>
      </div>
      
      <p class="text-small">This code expires in 10 minutes.</p>
      <p class="text-small">Email: ${email}</p>
      <p class="text-small" style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS</p>
      <p>Solar Site Pre-Assessment System</p>
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
      <img src="${CLOUDINARY_LOGO}" alt="SOLARIS" class="header-logo" />
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Welcome, ${name}</h2>
      <p class="text">Your account has been successfully created with ${email}.</p>
      
      <div class="info-box">
        <p><strong>Get started with SOLARIS</strong></p>
        <p>• Request free quotations</p>
        <p>• Book site pre-assessments</p>
        <p>• Track project progress</p>
        <p>• View assessment reports</p>
      </div>
      
      <p class="text-small">Log in to your account to begin your solar journey.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS</p>
      <p>Solar Site Pre-Assessment System</p>
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
  <title>Password Reset</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${CLOUDINARY_LOGO}" alt="SOLARIS" class="header-logo" />
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Reset your password</h2>
      <p class="text">Hello,</p>
      <p class="text">We received a request to reset your password. Use the code below:</p>
      
      <div class="code-box">
        <div class="code">${code}</div>
      </div>
      
      <p class="text-small">This code expires in 10 minutes.</p>
      <p class="text-small">Email: ${email}</p>
      <p class="text-small" style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS</p>
      <p>Solar Site Pre-Assessment System</p>
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
  <title>Password Reset Successful</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${CLOUDINARY_LOGO}" alt="SOLARIS" class="header-logo" />
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Password reset successful</h2>
      
      <div class="success-box">
        <p style="color: #ff6b00; margin: 0;"><strong>✓ Password changed</strong></p>
      </div>
      
      <p class="text">Hello,</p>
      <p class="text">Your password has been successfully reset for ${email}.</p>
      <p class="text">You can now log in with your new password.</p>
      <p class="text-small" style="margin-top: 20px;">If you didn't make this change, please contact support.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS</p>
      <p>Solar Site Pre-Assessment System</p>
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
  <title>Quotation Request Received</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${CLOUDINARY_LOGO}" alt="SOLARIS" class="header-logo" />
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Quotation request received</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">Thank you for requesting a quotation. Your request is being processed.</p>
      
      <div class="info-box">
        <p><strong>Reference:</strong> ${quoteReference}</p>
        <p><strong>Monthly Bill:</strong> ₱${parseInt(monthlyBill).toLocaleString()}</p>
        <p><strong>Property Type:</strong> ${propertyType}</p>
        ${desiredCapacity ? `<p><strong>Desired Capacity:</strong> ${desiredCapacity}</p>` : ''}
        <p><strong>Address:</strong> ${address}</p>
      </div>
      
      <div class="success-box">
        <p><strong>What's next?</strong></p>
        <p>• Review within 2-3 business days</p>
        <p>• Detailed quotation via email</p>
        <p>• Engineer may contact you</p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS</p>
      <p>Solar Site Pre-Assessment System</p>
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
  <title>Pre-Assessment Booking Confirmation</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${CLOUDINARY_LOGO}" alt="SOLARIS" class="header-logo" />
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Booking confirmation</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">Your pre-assessment booking has been created. Please complete payment to schedule.</p>
      
      <div class="info-box">
        <p><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p><strong>Amount:</strong> ₱${parseInt(amount).toLocaleString()}</p>
        <p><strong>Property:</strong> ${propertyType}</p>
        ${desiredCapacity ? `<p><strong>Capacity:</strong> ${desiredCapacity}</p>` : ''}
        ${roofType ? `<p><strong>Roof Type:</strong> ${roofType}</p>` : ''}
        <p><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString('en-PH')}</p>
        <p><strong>Address:</strong> ${address}</p>
      </div>
      
      <div class="warning-box">
        <p><strong>Payment instructions</strong></p>
        <p>1. Log in to your account</p>
        <p>2. Go to Billing section</p>
        <p>3. Pay invoice ${invoiceNumber}</p>
      </div>
      
      <p class="text-small">Booking confirmed after payment verification.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS</p>
      <p>Solar Site Pre-Assessment System</p>
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
  <title>Payment Received</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${CLOUDINARY_LOGO}" alt="SOLARIS" class="header-logo" />
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Payment received</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">We received your payment. Our team is verifying it.</p>
      
      <div class="pending-box">
        <p><strong>Payment details</strong></p>
        <p><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p><strong>Amount:</strong> ₱${parseInt(amount).toLocaleString()}</p>
        <p><strong>Reference:</strong> ${referenceNumber}</p>
        <p><strong>Property:</strong> ${propertyType}</p>
        <p><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString('en-PH')}</p>
      </div>
      
      <div class="warning-box">
        <p><strong>What's next?</strong></p>
        <p>• Verification within 24-48 hours</p>
        <p>• Confirmation email after verification</p>
        <p>• Track status in your dashboard</p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS</p>
      <p>Solar Site Pre-Assessment System</p>
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
  <title>Payment Verified</title>
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${CLOUDINARY_LOGO}" alt="SOLARIS" class="header-logo" />
      <h1>SOLARIS</h1>
    </div>
    <div class="content">
      <h2 class="title">Payment verified</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">Great news! Your payment has been verified.</p>
      
      <div class="success-box">
        <p><strong>✓ Payment verified</strong></p>
        <p><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p><strong>Amount:</strong> ₱${parseInt(amount).toLocaleString()}</p>
      </div>
      
      <div class="info-box">
        <p><strong>Assessment details</strong></p>
        <p><strong>Property:</strong> ${propertyType}</p>
        <p><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString('en-PH')}</p>
      </div>
      
      <div class="success-box">
        <p><strong>What's next?</strong></p>
        <p>• Team will confirm schedule</p>
        <p>• Engineer assigned to your assessment</p>
        <p>• Reminders before assessment date</p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS</p>
      <p>Solar Site Pre-Assessment System</p>
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
    
    const normalizedEmail = email.toLowerCase(); // ← Add this
    const code = generateCode();
    verificationCodes.set(normalizedEmail, { code, timestamp: Date.now(), type: 'verification' }); // ← Use normalized
    
    // Send email to original email (not normalized for display)
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "SOLARIS" },
      to: [{ email }],
      subject: "Verify your email address",
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
      subject: "Password reset code",
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
      subject: "Password reset successful",
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
      subject: `Quotation request received - ${quoteReference}`,
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
      subject: `Booking confirmation - ${invoiceNumber}`,
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
      subject: `Payment received - ${invoiceNumber}`,
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
      subject: `Payment verified - ${invoiceNumber}`,
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