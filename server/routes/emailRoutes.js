const express = require("express");
const axios = require("axios");

const router = express.Router();

// In-memory storage
const verificationCodes = new Map();

// Generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==================== CLOUDINARY LOGO URL ====================
const CLOUDINARY_LOGO = "https://d1yei2z3i6k35z.cloudfront.net/15683293/697d9fdf337fa_salferlogo.png";

// ==================== MODERN PREMIUM EMAIL STYLES ====================
const baseStyles = `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background-color: #f5f7fa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      margin: 0;
      padding: 24px 0;
    }
    .email-wrapper {
      max-width: 580px;
      margin: 0 auto;
      background-color: #f5f7fa;
      padding: 16px;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02);
      overflow: hidden;
      width: 100%;
    }
    /* Header with logo and name centered */
    .header {
      background: #0f1115;
      padding: 28px 24px 24px;
      text-align: center;
      border-bottom: none;
    }
    .header-logo {
      max-width: 60px;
      height: auto;
      border-radius: 12px;
      margin-bottom: 14px;
      display: inline-block;
    }
    .company-name {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
      margin: 0;
      line-height: 1.3;
    }
    .company-sub {
      color: #ff9a3c;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.8px;
      margin: 6px 0 0;
      text-transform: uppercase;
    }
    .gradient-divider {
      height: 3px;
      background: linear-gradient(90deg, #ff7a00, #ff9a3c, #ff7a00);
      width: 60px;
      margin: 20px auto 0;
      border-radius: 4px;
    }
    /* Content area */
    .content {
      padding: 36px 32px 32px;
    }
    .title {
      font-size: 26px;
      font-weight: 700;
      color: #0f1115;
      margin: 0 0 12px 0;
      letter-spacing: -0.3px;
      line-height: 1.2;
    }
    .text {
      color: #1a1a1a;
      font-size: 16px;
      line-height: 1.5;
      margin: 8px 0;
    }
    .text-secondary {
      color: #555555;
      font-size: 15px;
      margin: 6px 0;
    }
    .text-small {
      color: #888888;
      font-size: 13px;
      line-height: 1.4;
      margin: 6px 0;
    }
    /* Modern Code Box */
    .code-box {
      background: #f8fafc;
      border-radius: 20px;
      padding: 28px 20px;
      text-align: center;
      margin: 28px 0;
      border: 1px solid #eaedf2;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .code {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 6px;
      color: #ff7a00;
      display: inline-block;
      font-family: 'SF Mono', 'Menlo', monospace;
    }
    /* Info, Success, Warning boxes */
    .info-box {
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px 24px;
      margin: 24px 0;
      border-left: 3px solid #ff7a00;
    }
    .success-box {
      background: #fef9f0;
      border-radius: 16px;
      padding: 20px 24px;
      margin: 24px 0;
      border-left: 3px solid #ff9a3c;
    }
    .warning-box {
      background: #fff8f0;
      border-radius: 16px;
      padding: 20px 24px;
      margin: 24px 0;
      border-left: 3px solid #ff7a00;
    }
    .pending-box {
      background: #fef7e8;
      border-radius: 16px;
      padding: 20px 24px;
      margin: 24px 0;
      border-left: 3px solid #ff9a3c;
    }
    .info-box p, .success-box p, .warning-box p, .pending-box p {
      margin: 6px 0;
      font-size: 14px;
      color: #1a1a1a;
    }
    .info-box strong, .success-box strong, .warning-box strong, .pending-box strong {
      font-weight: 600;
      color: #0f1115;
    }
    .divider-light {
      height: 1px;
      background: #eaeaea;
      margin: 28px 0 20px;
    }
    .footer {
      background: #ffffff;
      padding: 24px 32px 32px;
      text-align: center;
      border-top: 1px solid #eaeaea;
    }
    .footer p {
      color: #888888;
      font-size: 12px;
      line-height: 1.4;
      margin: 6px 0;
    }
    /* Responsive */
    @media only screen and (max-width: 500px) {
      .content {
        padding: 28px 24px;
      }
      .title {
        font-size: 22px;
      }
      .code {
        font-size: 30px;
        letter-spacing: 4px;
      }
      .header {
        padding: 24px 20px;
      }
      .company-name {
        font-size: 20px;
      }
    }
    @media only screen and (max-width: 420px) {
      .code {
        font-size: 26px;
        letter-spacing: 3px;
      }
      .content {
        padding: 24px 20px;
      }
    }
    /* Outlook fallback */
    .outlook-fallback {
      border-collapse: collapse;
      width: 100%;
    }
  </style>
`;

// Helper to generate centered header HTML (logo on top, name below, all centered)
const getHeaderHtml = () => `
  <div class="header">
    <img src="${CLOUDINARY_LOGO}" alt="Salfare Engineering" class="header-logo" />
    <div class="company-name">Salfare Engineering</div>
    <div class="company-sub">Solar Technology Enterprise</div>
    <div class="gradient-divider"></div>
  </div>
`;

// =============== VERIFICATION EMAIL ===============
const verificationTemplate = (email, code) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
  ${baseStyles}
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;">
  <div class="email-wrapper">
    <div class="email-container">
      ${getHeaderHtml()}
      <div class="content">
        <h2 class="title">Verify your email</h2>
        <p class="text">Hello,</p>
        <p class="text-secondary">Use the secure code below to verify your email address and activate your account.</p>
        <div class="code-box">
          <span class="code">${code}</span>
        </div>
        <p class="text-small">This code expires in 10 minutes.</p>
        <p class="text-small">Email: ${email}</p>
        <div class="divider-light"></div>
        <p class="text-small">If you didn't request this, please ignore this email.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Salfare Engineering — Solar Technology Enterprise</p>
        <p>Professional Solar Site Pre-Assessment System</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// =============== WELCOME EMAIL ===============
const welcomeTemplate = (name, email) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Salfare Engineering</title>
  ${baseStyles}
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;">
  <div class="email-wrapper">
    <div class="email-container">
      ${getHeaderHtml()}
      <div class="content">
        <h2 class="title">Welcome, ${name}</h2>
        <p class="text">Your account has been successfully created with <strong>${email}</strong>. You are now part of Salfare Engineering's solar energy transformation.</p>
        <div class="info-box">
          <p><strong>Get started with Salfare Engineering</strong></p>
          <p>• Request free quotations — instant estimates</p>
          <p>• Book professional site pre-assessments</p>
          <p>• Track project progress in real time</p>
          <p>• Download detailed assessment reports</p>
        </div>
        <p class="text-secondary">Log in to your dashboard and take the first step toward energy independence.</p>
        <div class="divider-light"></div>
        <p class="text-small">Need help? Our support team is ready to assist you.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Salfare Engineering — Solar Technology Enterprise</p>
        <p>Professional Solar Site Pre-Assessment System</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// =============== FORGOT PASSWORD ===============
const forgotPasswordTemplate = (email, code) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
  ${baseStyles}
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;">
  <div class="email-wrapper">
    <div class="email-container">
      ${getHeaderHtml()}
      <div class="content">
        <h2 class="title">Reset your password</h2>
        <p class="text">Hello,</p>
        <p class="text-secondary">We received a request to reset your password. Use the secure code below to create a new password.</p>
        <div class="code-box">
          <span class="code">${code}</span>
        </div>
        <p class="text-small">This code is valid for 10 minutes.</p>
        <div class="divider-light"></div>
        <p class="text-small">If you didn't request a reset, you can safely ignore this message.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Salfare Engineering — Solar Technology Enterprise</p>
        <p>Professional Solar Site Pre-Assessment System</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// =============== PASSWORD RESET SUCCESS ===============
const resetSuccessTemplate = (email) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password reset successful</title>
  ${baseStyles}
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;">
  <div class="email-wrapper">
    <div class="email-container">
      ${getHeaderHtml()}
      <div class="content">
        <h2 class="title">Password reset successful</h2>
        <div class="success-box">
          <p><strong>Your password has been changed</strong></p>
        </div>
        <p class="text">Hello,</p>
        <p class="text-secondary">Your password has been successfully reset for <strong>${email}</strong>.</p>
        <p class="text-secondary">You can now log in with your new password and continue managing your solar projects.</p>
        <div class="divider-light"></div>
        <p class="text-small">If you didn't make this change, please contact our support team immediately.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Salfare Engineering — Solar Technology Enterprise</p>
        <p>Professional Solar Site Pre-Assessment System</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// =============== FREE QUOTE REQUEST ===============
const freeQuoteTemplate = (name, quoteReference, monthlyBill, propertyType, address) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation Request Received</title>
  ${baseStyles}
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;">
  <div class="email-wrapper">
    <div class="email-container">
      ${getHeaderHtml()}
      <div class="content">
        <h2 class="title">Quotation request received</h2>
        <p class="text">Hello ${name},</p>
        <p class="text-secondary">Thank you for trusting Salfare Engineering. Your quotation request has been submitted and is being processed.</p>
        <div class="info-box">
          <p><strong>Reference ID:</strong> ${quoteReference}</p>
          <p><strong>Monthly Bill:</strong> ₱${parseInt(monthlyBill).toLocaleString()}</p>
          <p><strong>Property Type:</strong> ${propertyType}</p>
         
          <p><strong>Address:</strong> ${address}</p>
        </div>
        <div class="success-box">
          <p><strong>What's next?</strong></p>
          <p>• Our energy experts will review within 2-3 business days</p>
          <p>• You will receive a detailed quotation via email</p>
          <p>• An engineer may reach out for site clarification</p>
        </div>
        <p class="text-small">We are committed to bringing you the best solar solution.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Salfare Engineering — Solar Technology Enterprise</p>
        <p>Professional Solar Site Pre-Assessment System</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// =============== PRE-ASSESSMENT BOOKING ===============
const preAssessmentTemplate = (name, invoiceNumber, amount, propertyType,  roofType, address) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pre-Assessment Booking</title>
  ${baseStyles}
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;">
  <div class="email-wrapper">
    <div class="email-container">
      ${getHeaderHtml()}
      <div class="content">
        <h2 class="title">Booking confirmation</h2>
        <p class="text">Hello ${name},</p>
        <p class="text-secondary">Your pre-assessment booking has been created. Please complete the payment to secure your schedule.</p>
        <div class="info-box">
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Amount:</strong> ₱${parseInt(amount).toLocaleString()}</p>
          <p><strong>Property Type:</strong> ${propertyType}</p>
         
          ${roofType ? `<p><strong>Roof Type:</strong> ${roofType}</p>` : ''}
          
          <p><strong>Address:</strong> ${address}</p>
        </div>
        <div class="warning-box">
          <p><strong>Payment instructions</strong></p>
          <p>1. Log in to your Salfare Engineering dashboard</p>
          <p>2. Navigate to Billing section</p>
          <p>3. Pay invoice <strong>${invoiceNumber}</strong> using available methods</p>
        </div>
        <p class="text-small">Booking will be confirmed after payment verification.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Salfare Engineering — Solar Technology Enterprise</p>
        <p>Professional Solar Site Pre-Assessment System</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// =============== PAYMENT SUBMISSION CONFIRMATION ===============
const paymentSubmissionTemplate = (name, invoiceNumber, amount, referenceNumber, propertyType) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
  ${baseStyles}
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;">
  <div class="email-wrapper">
    <div class="email-container">
      ${getHeaderHtml()}
      <div class="content">
        <h2 class="title">Payment received</h2>
        <p class="text">Hello ${name},</p>
        <p class="text-secondary">We have received your payment. Our finance team will verify the transaction shortly.</p>
        <div class="pending-box">
          <p><strong>Payment details</strong></p>
          <p><strong>Invoice:</strong> ${invoiceNumber}</p>
          <p><strong>Amount:</strong> ₱${parseInt(amount).toLocaleString()}</p>
          <p><strong>Reference Number:</strong> ${referenceNumber}</p>
          <p><strong>Property Type:</strong> ${propertyType}</p>
         
        </div>
        <div class="warning-box">
          <p><strong>Verification in progress</strong></p>
          <p>• Usually takes 24-48 hours</p>
          <p>• You will receive a confirmation email once verified</p>
          <p>• Track status in your dashboard</p>
        </div>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Salfare Engineering — Solar Technology Enterprise</p>
        <p>Professional Solar Site Pre-Assessment System</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// =============== PAYMENT VERIFIED CONFIRMATION ===============
const paymentVerifiedTemplate = (name, invoiceNumber, amount, propertyType) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Verified</title>
  ${baseStyles}
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;">
  <div class="email-wrapper">
    <div class="email-container">
      ${getHeaderHtml()}
      <div class="content">
        <h2 class="title">Payment verified</h2>
        <p class="text">Hello ${name},</p>
        <p class="text-secondary">Great news. Your payment has been officially verified. Your site pre-assessment is now confirmed.</p>
        <div class="success-box">
          <p><strong>Payment verified</strong></p>
          <p><strong>Invoice:</strong> ${invoiceNumber}</p>
          <p><strong>Amount:</strong> ₱${parseInt(amount).toLocaleString()}</p>
        </div>
        <div class="info-box">
          <p><strong>Assessment details</strong></p>
          <p><strong>Property Type:</strong> ${propertyType}</p>
          
        </div>
        <div class="success-box">
          <p><strong>What's next?</strong></p>
          <p>• Our team will confirm the exact schedule</p>
          <p>• A certified engineer will be assigned</p>
          <p>• You will receive reminders prior to the assessment</p>
        </div>
        <p class="text-small">Thank you for moving forward with Salfare Engineering.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Salfare Engineering — Solar Technology Enterprise</p>
        <p>Professional Solar Site Pre-Assessment System</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// ==================== ALL ROUTES (backend logic untouched) ====================

router.post("/send-verification", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });
    
    const normalizedEmail = email.toLowerCase().trim();
    const code = generateCode();
    
    verificationCodes.set(normalizedEmail, { 
      code, 
      timestamp: Date.now(), 
      type: 'verification',
      attempts: 0 
    });
    
    console.log('Code stored for:', normalizedEmail, 'Code:', code);
    
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
      to: [{ email }],
      subject: "Verify your email address",
      htmlContent: verificationTemplate(email, code)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Verification code sent" });
  } catch (error) {
    console.error("Send verification error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

router.post("/send-reset-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const normalizedEmail = email.toLowerCase().trim();
    const code = generateCode();
    
    verificationCodes.set(normalizedEmail, { 
      code, 
      timestamp: Date.now(), 
      type: 'reset',
      attempts: 0 
    });
    
    console.log('Reset code stored for:', normalizedEmail, 'Code:', code);

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
      to: [{ email }],
      subject: "Password reset code",
      htmlContent: forgotPasswordTemplate(email, code)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Reset code sent" });
  } catch (error) {
    console.error("Send reset code error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send reset code" });
  }
});

router.post("/resend-code", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });
    
    const normalizedEmail = email.toLowerCase().trim();
    const code = generateCode();
    
    verificationCodes.delete(normalizedEmail);
    verificationCodes.set(normalizedEmail, { 
      code, 
      timestamp: Date.now(), 
      type: 'verification',
      attempts: 0 
    });
    
    console.log('New code sent for:', normalizedEmail, 'Code:', code);
    
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
      to: [{ email }],
      subject: "New verification code",
      htmlContent: verificationTemplate(email, code)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "New verification code sent" });
  } catch (error) {
    console.error("Resend code error:", error.message);
    res.status(500).json({ success: false, message: "Failed to resend code" });
  }
});

router.post("/verify-code", (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { code } = req.body;

    console.log('Verifying code for email:', email);
    const stored = verificationCodes.get(email);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: "No code found. Please request a new code."
      });
    }

    if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Code expired. Please request a new code."
      });
    }

    if (stored.code !== code) {
      const attempts = stored.attempts ? stored.attempts + 1 : 1;
      stored.attempts = attempts;
      verificationCodes.set(email, stored);
      const attemptsLeft = 3 - attempts;
      if (attemptsLeft <= 0) {
        verificationCodes.delete(email);
        return res.status(400).json({
          success: false,
          message: "Too many invalid attempts. Please request a new code."
        });
      }
      return res.status(400).json({
        success: false,
        message: `Invalid code. ${attemptsLeft} attempts remaining.`
      });
    }

    verificationCodes.delete(email);
    res.json({ success: true, message: "Code verified successfully" });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ success: false, message: "Verification failed. Please try again." });
  }
});

router.post("/send-welcome", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ success: false, message: "Email and name required" });

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
      to: [{ email }],
      subject: "Welcome to Salfare Engineering",
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

router.post("/send-reset-success", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
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

router.post("/send-free-quote-confirmation", async (req, res) => {
  try {
    const { email, name, quoteReference, monthlyBill, propertyType,  address } = req.body;
    if (!email || !name || !quoteReference) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
      to: [{ email }],
      subject: `Quotation request received - ${quoteReference}`,
      htmlContent: freeQuoteTemplate(name, quoteReference, monthlyBill, propertyType, address)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Quote confirmation email sent" });
  } catch (error) {
    console.error("Quote email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send quote confirmation email" });
  }
});

router.post("/send-pre-assessment-confirmation", async (req, res) => {
  try {
    const { email, name, invoiceNumber, amount, propertyType,  roofType,address } = req.body;
    if (!email || !name || !invoiceNumber) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
      to: [{ email }],
      subject: `Booking confirmation - ${invoiceNumber}`,
      htmlContent: preAssessmentTemplate(name, invoiceNumber, amount, propertyType,roofType, address)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Pre-assessment confirmation email sent" });
  } catch (error) {
    console.error("Pre-assessment email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send pre-assessment confirmation email" });
  }
});

router.post("/send-payment-confirmation", async (req, res) => {
  try {
    const { email, name, invoiceNumber, amount, referenceNumber, propertyType  } = req.body;
    if (!email || !name || !invoiceNumber) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
      to: [{ email }],
      subject: `Payment received - ${invoiceNumber}`,
      htmlContent: paymentSubmissionTemplate(name, invoiceNumber, amount, referenceNumber, propertyType)
    }, {
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" }
    });

    res.json({ success: true, message: "Payment confirmation email sent" });
  } catch (error) {
    console.error("Payment confirmation email error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send payment confirmation email" });
  }
});

router.post("/send-payment-verified", async (req, res) => {
  try {
    const { email, name, invoiceNumber, amount, propertyType} = req.body;
    if (!email || !name || !invoiceNumber) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
      to: [{ email }],
      subject: `Payment verified - ${invoiceNumber}`,
      htmlContent: paymentVerifiedTemplate(name, invoiceNumber, amount, propertyType)
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