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
  isActive: {
    type: Boolean,
    default: true
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Add a method to check if account is locked
userSchema.methods.isLocked = function() {
  if (!this.lockUntil) return false;
  return this.lockUntil > new Date();
};

module.exports = mongoose.model("User", userSchema);