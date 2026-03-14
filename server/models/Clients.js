// models/Client.js
const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  companyName: { type: String, default: "" },
  contactFirstName: { type: String, default: "" },
  contactMiddleName: { type: String, default: "" },
  contactLastName: { type: String, default: "" },
  contactNumber: { type: String, default: "" },
  address: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  account_setup: { type: Boolean, default: false },
  client_type: { type: String, default: "Individual", enum: ["Individual", "Company"] }
});

module.exports = mongoose.model("Client", ClientSchema);