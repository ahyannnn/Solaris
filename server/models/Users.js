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
    enum: ["user", "admin", "technician"],
    default: "user"
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);