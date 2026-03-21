// models/Clients.js
const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  companyName: { type: String, default: "" },
  contactFirstName: { type: String, default: "" },
  contactMiddleName: { type: String, default: "" },
  contactLastName: { type: String, default: "" },
  contactNumber: { type: String, default: "" },
  birthday: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  account_setup: { type: Boolean, default: false },
  client_type: { 
    type: String, 
    default: "Residential", 
    enum: ["Residential", "Company", "Industrial"]  // Changed from "Individual" to "Residential"
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate to get addresses
ClientSchema.virtual('addresses', {
  ref: 'Address',
  localField: '_id',
  foreignField: 'clientId',
  justOne: false
});

// Virtual to get primary address
ClientSchema.virtual('primaryAddress', {
  ref: 'Address',
  localField: '_id',
  foreignField: 'clientId',
  match: { isPrimary: true },
  justOne: true
});

module.exports = mongoose.model("Client", ClientSchema);