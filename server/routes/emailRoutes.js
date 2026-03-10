const express = require("express");
const axios = require("axios");

const router = express.Router();

// In-memory storage
const verificationCodes = new Map();

// Generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==================== MINIMAL EMAIL TEMPLATES ====================

// Base styles (minimal, no icons)
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
      
      <div style="background: #f8f9fa; padding: 20px; margin: 20px 0;">
        <p class="text" style="margin: 5px 0;">• Site Assessments</p>
        <p class="text" style="margin: 5px 0;">• Project Tracking</p>
        <p class="text" style="margin: 5px 0;">• IoT Data Monitoring</p>
        <p class="text" style="margin: 5px 0;">• Reports Generation</p>
      </div>
      
      <p class="text-small">You can now log in to access SOLARIS.</p>
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
      
      <div style="background: #f8f9fa; padding: 15px; margin: 20px 0;">
        <p class="text-small" style="margin: 5px 0;">• Enter the 6-digit code</p>
        <p class="text-small" style="margin: 5px 0;">• Create a new password</p>
        <p class="text-small" style="margin: 5px 0;">• Login with new credentials</p>
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
      
      <div style="background: #e8f5e9; border: 1px solid #2ecc71; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="color: #2ecc71; font-size: 18px; margin: 0;">✓ Password Changed</p>
      </div>
      
      <p class="text">Hello,</p>
      <p class="text">Your password has been successfully reset for your SOLARIS account associated with ${email}.</p>
      <p class="text-small">You can now log in using your new password.</p>
      <p class="text-small">If you didn't make this change, please contact support immediately.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SOLARIS. All rights reserved.</p>
      <p>IoT-Based Solar Site Pre-Assessment System</p>
    </div>
  </div>
</body>
</html>
`;

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

    await axios.post(process.env.POST_BREVO_URL, {
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

    await axios.post(process.env.POST_BREVO_URL, {
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
    const { email, code } = req.body;
    const stored = verificationCodes.get(email);

    if (!stored) return res.status(400).json({ success: false, message: "No code found" });
    
    if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(email);
      return res.status(400).json({ success: false, message: "Code expired" });
    }
    
    if (stored.code !== code) return res.status(400).json({ success: false, message: "Invalid code" });

    verificationCodes.delete(email);
    res.json({ success: true, message: "Code verified" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Verification failed" });
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

    await axios.post(process.env.POST_BREVO_URL, {
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

    await axios.post(process.env.POST_BREVO_URL, {
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

module.exports = router;