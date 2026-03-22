// models/Users.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  passwordHash: {
    type: String
  },

  provider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },

  googleId: {
    type: String,
    default: null
  },

  role: {
    type: String,
    enum: ["user", "admin", "engineer"],
    default: "user"
  },

  // Add these two fields for admin features
  isActive: {
    type: Boolean,
    default: true
  },

  lastLogin: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);