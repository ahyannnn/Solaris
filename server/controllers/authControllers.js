const User = require("../models/Users.js");
const Client = require("../models/Clients.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AuditLog = require("../models/AuditLog");

/*
=========================
REGISTER (UPDATED)
=========================
*/
exports.register = async (req, res) => {
  try {
    const { fullName, contactFirstName, contactMiddleName, contactLastName, email, password } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      fullName,  // Combined first + last name for display
      email,
      passwordHash,
      role: "user",
      provider: "local"
    });

    await newUser.save();

    // Create client record with contact name fields
    const client = new Client({
      userId: newUser._id,
      contactFirstName: contactFirstName,
      contactMiddleName: contactMiddleName || '',  // Optional
      contactLastName: contactLastName,
      account_setup: false,
      client_type: "Residential"  // Default
    });

    await client.save();

    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: newUser,
      client: client,
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

/*
=========================
LOGIN (UPDATED - email only)
=========================
*/
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Search by email only
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    // Save audit trail
    await AuditLog.create({
      user: user._id,
      role: user.role,
      module: "Authentication",
      action: "User logged in"
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

/*
=========================
GOOGLE REGISTER (UPDATED)
=========================
*/
exports.googleRegister = async (req, res) => {
  try {
    const { fullName, contactFirstName, contactMiddleName, contactLastName, email, googleId, photoURL } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists → login
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Ensure client exists with contact name fields
      let client = await Client.findOne({ userId: user._id });
      if (!client) {
        client = new Client({
          userId: user._id,
          contactFirstName: contactFirstName || '',
          contactMiddleName: contactMiddleName || '',
          contactLastName: contactLastName || '',
          account_setup: false,
          client_type: "Residential"
        });
        await client.save();
      }

      return res.json({
        message: "Login successful",
        token,
        user,
        client,
      });
    }

    // User does not exist → register
    const randomPassword = Math.random().toString(36).slice(-10);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    user = new User({
      fullName: fullName || `${contactFirstName} ${contactLastName}`.trim(),
      email,
      passwordHash,
      provider: "google",
      googleId,
      photoURL,
      role: "user",
    });

    await user.save();

    // Create a new client record with contact name fields
    const client = new Client({
      userId: user._id,
      contactFirstName: contactFirstName || '',
      contactMiddleName: contactMiddleName || '',
      contactLastName: contactLastName || '',
      account_setup: false,
      client_type: "Residential"
    });
    await client.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Google registration successful",
      token,
      user,
      client,
    });

  } catch (error) {
    console.error("Google register error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/*
=========================
GOOGLE LOGIN (UPDATED)
=========================
*/
exports.googleLogin = async (req, res) => {
  try {
    const { fullName, contactFirstName, contactMiddleName, contactLastName, email, googleId, photoURL } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = new User({
        fullName: fullName || `${contactFirstName} ${contactLastName}`.trim(),
        email,
        passwordHash,
        provider: "google",
        googleId,
        photoURL,
        role: "user"
      });

      await user.save();

      // Create client with contact name fields
      const client = new Client({
        userId: user._id,
        contactFirstName: contactFirstName || '',
        contactMiddleName: contactMiddleName || '',
        contactLastName: contactLastName || '',
        account_setup: false,
        client_type: "Residential"
      });
      await client.save();
    }
    // Audit Trail
    await AuditLog.create({
      user: user._id,
      role: user.role,
      module: "Authentication",
      action: "User logged in via Google"
    });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Google login successful",
      token,
      user
    });

  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

/*
=========================
RESET PASSWORD
=========================
*/
exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and new password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user.passwordHash = passwordHash;
    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

/*
=========================
CHECK EMAIL
=========================
*/
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists in database
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.json({
        exists: true,
        message: 'Email already registered'
      });
    }

    return res.json({
      exists: false,
      message: 'Email available'
    });
  } catch (error) {
    console.error('Email check error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

