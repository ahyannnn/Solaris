// models/Address.js
const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Client", 
    required: true,
    index: true 
  },
  
  // Address fields with exact names as specified
  houseOrBuilding: { type: String, default: "" },
  street: { type: String, default: "" },
  barangay: { type: String, default: "" },
  cityMunicipality: { type: String, default: "" }, // Combined field
  province: { type: String, default: "" },
  zipCode: { type: String, default: "" },
  
  // Additional fields for address management
  label: { 
    type: String, 
    default: "Primary",
    enum: ["Primary", "Secondary", "Office", "Other"]
  },
  
  isPrimary: { 
    type: Boolean, 
    default: false 
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  
  
  notes: { type: String, default: "" }
}, {
  timestamps: true
});

// Ensure only one primary address per client
AddressSchema.index({ clientId: 1, isPrimary: 1 }, { 
  unique: true, 
  partialFilterExpression: { isPrimary: true } 
});

// Method to get full address as string
AddressSchema.methods.getFullAddress = function() {
  const parts = [
    this.houseOrBuilding,
    this.street,
    this.barangay,
    this.cityMunicipality,
    this.province,
    this.zipCode
  ].filter(part => part && part.trim() !== '');
  
  return parts.join(', ');
};

// Static method to set primary address
AddressSchema.statics.setPrimaryAddress = async function(clientId, addressId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Remove primary flag from all addresses of this client
    await this.updateMany(
      { clientId },
      { isPrimary: false },
      { session }
    );
    
    // Set new primary address
    const address = await this.findByIdAndUpdate(
      addressId,
      { isPrimary: true },
      { session, new: true }
    );
    
    await session.commitTransaction();
    return address;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = mongoose.model("Address", AddressSchema);