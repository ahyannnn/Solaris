const User = require("../models/Users.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/*
=========================
REGISTER
=========================
*/
exports.register = async (req, res) => {
  try {

    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      passwordHash,
      role: "user",
      provider: "local"
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: newUser
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
EMAIL + PASSWORD LOGIN
=========================
*/
exports.login = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

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
GOOGLE REGISTER
=========================
*/
exports.googleRegister = async (req, res) => {

  try {

    const { fullName, email, googleId, photoURL } = req.body;

    let user = await User.findOne({ email });

    // If already exists → login instead
    if (user) {

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        token,
        user
      });

    }

    const randomPassword = Math.random().toString(36).slice(-10);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    user = new User({
      fullName,
      email,
      passwordHash,
      provider: "google",
      googleId,
      photoURL,
      role: "user"
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Google registration successful",
      token,
      user
    });

  } catch (error) {

    console.error("Google register error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

};


/*
=========================
GOOGLE LOGIN
=========================
*/
exports.googleLogin = async (req, res) => {

  try {

    const { fullName, email, googleId, photoURL } = req.body;

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
        fullName,
        email,
        passwordHash,
        provider: "google",
        googleId,
        photoURL,
        role: "user"
      });

      await user.save();

    }

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