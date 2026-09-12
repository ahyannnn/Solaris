const express = require("express");
const axios = require("axios");
const User = require("../models/Users");

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
    /* Minimal detail list (no boxes, no accent borders) —
       label left, value right, hairline separators only */
    .detail-heading {
      font-size: 14px;
      font-weight: 700;
      color: #0f1115;
      margin: 24px 0 0;
    }
    .detail-list {
      margin: 8px 0 8px;
      border-top: 1px solid #eee;
    }
    .detail-list p {
      margin: 0;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
      font-size: 14px;
      color: #1a1a1a;
      overflow: hidden;
    }
    .detail-label {
      color: #888888;
      font-size: 13px;
    }
    .detail-value {
      float: right;
      font-weight: 600;
      color: #0f1115;
      text-align: right;
      max-width: 62%;
    }
    .steps {
      margin: 8px 0 8px 20px;
      padding: 0;
      color: #1a1a1a;
      font-size: 14px;
    }
    .steps li {
      margin: 6px 0;
    }
    .divider-light {
      height: 1px;
      background: #eaeaea;
      margin: 28px 0 20px;
    }
    /* Dark footer inside the card, matching the header */
    .footer {
      background: #0f1115;
      padding: 24px 32px 32px;
      text-align: center;
      border-top: none;
    }
    .footer p {
      color: #9aa0a6;
      font-size: 12px;
      line-height: 1.4;
      margin: 6px 0;
    }
    .footer-links {
      margin: 2px 0 10px;
    }
    .footer-links a {
      color: #ff7a00;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      margin: 0 8px;
    }
    /* CSS-only brand dots (no external images, email-safe) */
    .fb-logo, .app-icon {
      display: inline-block;
      width: 18px;
      height: 18px;
      line-height: 18px;
      border-radius: 50%;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
      font-family: Helvetica, Arial, sans-serif;
      vertical-align: -4px;
      margin-right: 6px;
    }
    .fb-logo {
      background: #1877F2;
    }
    .app-icon {
      background: #ff7a00;
    }
    .footer-mail {
      color: #9aa0a6;
      text-decoration: none;
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

// ==================== PUBLIC CONTACT DETAILS ====================
const FACEBOOK_URL = "https://www.facebook.com/lightupsolartech";
const APP_DOWNLOAD_URL = "https://www.solarisiot.com/";
const OFFICE_ADDRESS = "San Nicolas St. Bunsuran 3rd, Pandi, Bulacan";
const CONTACT_EMAIL = "salfer.engineering@gmail.com";
const CONTACT_PHONE = "0951-907-9171";

// Shared minimal footer: contact links + address, then brand lines.
const getFooterHtml = () => `
  <div class="footer">
    <p class="footer-links">
      <a href="${FACEBOOK_URL}"><span class="fb-logo">f</span>Facebook</a> ·
      <a href="${APP_DOWNLOAD_URL}"><span class="app-icon">↓</span>Download the App</a>
    </p>
    <p>📍 ${OFFICE_ADDRESS}</p>
    <p>✉️ <a class="footer-mail" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> · 📞 ${CONTACT_PHONE}</p>
    <p>© ${new Date().getFullYear()} Salfare Engineering — Solar Technology Enterprise</p>
    <p>Professional Solar Site Pre-Assessment System</p>
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
      ${getFooterHtml()}
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
        <p class="detail-heading">Get started with Salfare Engineering</p>
        <ul class="steps">
          <li>Request free quotations — instant estimates</li>
          <li>Book professional site pre-assessments</li>
          <li>Track project progress in real time</li>
          <li>Download detailed assessment reports</li>
        </ul>
        <p class="text-secondary">Log in to your dashboard and take the first step toward energy independence.</p>
        <div class="divider-light"></div>
        <p class="text-small">Need help? Our support team is ready to assist you.</p>
      </div>
      ${getFooterHtml()}
    </div>
  </div>
</body>
</html>
`;

// =============== FORGOT PASSWORD ===============
const forgotPasswordTemplate = (email, code, name = '') => `
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
        <p class="text">Hello${name ? ` ${name}` : ''},</p>
        <p class="text-secondary">We received a request to reset your password. Use the secure code below to create a new password.</p>
        <div class="code-box">
          <span class="code">${code}</span>
        </div>
        <p class="text-small">This code is valid for 10 minutes.</p>
        <div class="divider-light"></div>
        <p class="text-small">If you didn't request a reset, you can safely ignore this message.</p>
      </div>
      ${getFooterHtml()}
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
        <p class="text">Hello,</p>
        <p class="text-secondary">Your password has been successfully reset for <strong>${email}</strong>.</p>
        <p class="text-secondary">You can now log in with your new password and continue managing your solar projects.</p>
        <div class="divider-light"></div>
        <p class="text-small">If you didn't make this change, please contact our support team immediately.</p>
      </div>
      ${getFooterHtml()}
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
        <div class="detail-list">
          <p><span class="detail-label">Reference ID</span><span class="detail-value">${quoteReference}</span></p>
          <p><span class="detail-label">Monthly Bill</span><span class="detail-value">₱${parseInt(monthlyBill).toLocaleString()}</span></p>
          <p><span class="detail-label">Property Type</span><span class="detail-value">${propertyType}</span></p>
          <p><span class="detail-label">Address</span><span class="detail-value">${address}</span></p>
        </div>
        <p class="detail-heading">What's next?</p>
        <ul class="steps">
          <li>Our energy experts will review within 2-3 business days</li>
          <li>You will receive a detailed quotation via email</li>
          <li>An engineer may reach out for site clarification</li>
        </ul>
        <p class="text-small">We are committed to bringing you the best solar solution.</p>
      </div>
      ${getFooterHtml()}
    </div>
  </div>
</body>
</html>
`;

// =============== PRE-ASSESSMENT BOOKING ===============
const preAssessmentTemplate = (name, bookingReference, amount, propertyType, roofType, address) => `
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
        <h2 class="title">Booking Confirmation</h2>
        <p class="text">Hello ${name},</p>
        <p class="text-secondary">Your pre-assessment booking has been created. Please complete the payment to secure your schedule.</p>
        <div class="detail-list">
          <p><span class="detail-label">Booking Reference</span><span class="detail-value">${bookingReference}</span></p>
          <p><span class="detail-label">Amount</span><span class="detail-value">₱${parseInt(amount).toLocaleString()}</span></p>
          <p><span class="detail-label">Property Type</span><span class="detail-value">${propertyType}</span></p>
          ${roofType ? `<p><span class="detail-label">Roof Type</span><span class="detail-value">${roofType}</span></p>` : ''}
          <p><span class="detail-label">Address</span><span class="detail-value">${address}</span></p>
        </div>
        <p class="detail-heading">Payment instructions</p>
        <ol class="steps">
          <li>Log in to your Salfer Engineering dashboard</li>
          <li>Navigate to Billing section</li>
          <li>Pay for booking reference <strong>${bookingReference}</strong> using available methods</li>
        </ol>
        <p class="text-small">Booking will be confirmed after payment verification.</p>
      </div>
      ${getFooterHtml()}
    </div>
  </div>
</body>
</html>`;

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
        <p class="detail-heading">Payment details</p>
        <div class="detail-list">
          <p><span class="detail-label">Invoice</span><span class="detail-value">${invoiceNumber}</span></p>
          <p><span class="detail-label">Amount</span><span class="detail-value">₱${parseInt(amount).toLocaleString()}</span></p>
          <p><span class="detail-label">Reference Number</span><span class="detail-value">${referenceNumber}</span></p>
          <p><span class="detail-label">Property Type</span><span class="detail-value">${propertyType}</span></p>
        </div>
        <p class="detail-heading">Verification in progress</p>
        <ul class="steps">
          <li>Usually takes 24-48 hours</li>
          <li>You will receive a confirmation email once verified</li>
          <li>Track status in your dashboard</li>
        </ul>
      </div>
      ${getFooterHtml()}
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
        <p class="detail-heading">Payment verified</p>
        <div class="detail-list">
          <p><span class="detail-label">Invoice</span><span class="detail-value">${invoiceNumber}</span></p>
          <p><span class="detail-label">Amount</span><span class="detail-value">₱${parseInt(amount).toLocaleString()}</span></p>
          <p><span class="detail-label">Property Type</span><span class="detail-value">${propertyType}</span></p>
        </div>
        <p class="detail-heading">What's next?</p>
        <ul class="steps">
          <li>Our team will confirm the exact schedule</li>
          <li>A certified engineer will be assigned</li>
          <li>You will receive reminders prior to the assessment</li>
        </ul>
        <p class="text-small">Thank you for moving forward with Salfare Engineering.</p>
      </div>
      ${getFooterHtml()}
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

    // Look up the account name for a personalized greeting.
    // Non-blocking: the email still sends as "Hello," if lookup fails.
    let recipientName = '';
    try {
      const account = await User.findOne({ email: normalizedEmail })
        .select('fullName')
        .lean();
      if (account && account.fullName) recipientName = account.fullName;
    } catch (lookupError) {
      console.error('Reset-code name lookup error:', lookupError.message);
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
      to: [{ email }],
      subject: "Password reset code",
      htmlContent: forgotPasswordTemplate(email, code, recipientName)
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
    const { email, name, quoteReference, monthlyBill, propertyType, address } = req.body;
    
    // ✅ Make sure all fields are validated
    if (!email || !name || !quoteReference) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: email, name, and quoteReference are required" 
      });
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
    // ✅ CHANGE: Expect bookingReference instead of invoiceNumber
    const { email, name, bookingReference, amount, propertyType, roofType, address } = req.body;
    
    // ✅ CHANGE: Validate bookingReference instead of invoiceNumber
    if (!email || !name || !bookingReference) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: email, name, and bookingReference are required" 
      });
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: "Salfare Engineering" },
      to: [{ email }],
      // ✅ CHANGE: Use bookingReference in subject
      subject: `Booking confirmation - ${bookingReference}`,
      // ✅ CHANGE: Pass bookingReference to template
      htmlContent: preAssessmentTemplate(name, bookingReference, amount, propertyType, roofType, address)
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