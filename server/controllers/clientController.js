// controllers/clientController.js
const Client = require('../models/Clients');
const Address = require('../models/Address');
const mongoose = require('mongoose');

// Update client info (personal info only - address handled separately)
exports.updateClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Fix enum casing and map to valid values
    if (updateData.client_type) {
      const clientTypeMap = {
        'residential': 'Residential',
        'company': 'Company',
        'industrial': 'Industrial',
        'Residential': 'Residential',
        'Company': 'Company',
        'Industrial': 'Industrial'
      };
      
      const normalizedType = updateData.client_type.toLowerCase();
      updateData.client_type = clientTypeMap[normalizedType] || 'Residential';
    }

    // Format birthday if provided
    if (updateData.birthday) {
      updateData.birthday = new Date(updateData.birthday);
    }

    let client = await Client.findOne({ userId });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    client = await Client.findOneAndUpdate(
      { userId },
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
        new: true
      }
    ).populate('userId', 'email');

    res.json({
      message: "Client updated successfully",
      client: {
        ...client.toObject(),
        email: client.userId?.email || '',
        birthday: client.birthday ? client.birthday.toISOString().split('T')[0] : null
      }
    });

  } catch (error) {
    console.error("Client update error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// Get client info
exports.getClientInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const client = await Client.findOne({ userId }).populate('userId', 'email');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Get client's addresses
    const addresses = await Address.find({ clientId: client._id, isActive: true });
    const primaryAddress = addresses.find(addr => addr.isPrimary) || addresses[0];

    // Transform the data
    const clientData = {
      ...client.toObject(),
      email: client.userId?.email || '',
      birthday: client.birthday ? client.birthday.toISOString().split('T')[0] : null,
      addresses: addresses.map(addr => ({
        ...addr.toObject(),
        fullAddress: addr.getFullAddress ? addr.getFullAddress() : ''
      })),
      primaryAddress: primaryAddress ? {
        ...primaryAddress.toObject(),
        fullAddress: primaryAddress.getFullAddress ? primaryAddress.getFullAddress() : ''
      } : null
    };

    res.json({ client: clientData });
  } catch (error) {
    console.error('Get client info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADD ADDRESS
exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressData = req.body;

    // Find client
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if this is the first address (make it primary)
    const addressCount = await Address.countDocuments({ clientId: client._id });
    
    const address = new Address({
      clientId: client._id,
      houseOrBuilding: addressData.houseOrBuilding || '',
      street: addressData.street || '',
      barangay: addressData.barangay || '',
      cityMunicipality: addressData.cityMunicipality || '',
      province: addressData.province || '',
      zipCode: addressData.zipCode || '',
      label: addressData.label || 'Primary',
      isPrimary: addressCount === 0 ? true : (addressData.isPrimary || false),
      notes: addressData.notes || ''
    });

    // If setting as primary, remove primary from others
    if (address.isPrimary) {
      await Address.updateMany(
        { clientId: client._id },
        { isPrimary: false }
      );
    }

    await address.save();

    res.status(201).json({
      message: 'Address added successfully',
      address: {
        ...address.toObject(),
        fullAddress: address.getFullAddress ? address.getFullAddress() : ''
      }
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE ADDRESS
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const updateData = req.body;

    // Find client
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Find address and verify ownership
    const address = await Address.findOne({ 
      _id: addressId, 
      clientId: client._id 
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If setting as primary, remove primary from others
    if (updateData.isPrimary && !address.isPrimary) {
      await Address.updateMany(
        { clientId: client._id, _id: { $ne: addressId } },
        { isPrimary: false }
      );
    }

    // Update address
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Address updated successfully',
      address: {
        ...updatedAddress.toObject(),
        fullAddress: updatedAddress.getFullAddress ? updatedAddress.getFullAddress() : ''
      }
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE ADDRESS (soft delete)
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    // Find client
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Find address and verify ownership
    const address = await Address.findOne({ 
      _id: addressId, 
      clientId: client._id 
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Soft delete
    address.isActive = false;
    await address.save();

    // If this was primary address, set another as primary
    if (address.isPrimary) {
      const anotherAddress = await Address.findOne({ 
        clientId: client._id, 
        _id: { $ne: addressId },
        isActive: true 
      });

      if (anotherAddress) {
        anotherAddress.isPrimary = true;
        await anotherAddress.save();
      }
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET ALL ADDRESSES
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find client
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Get addresses
    const addresses = await Address.find({ 
      clientId: client._id, 
      isActive: true 
    }).sort({ isPrimary: -1, createdAt: -1 });

    res.json({
      addresses: addresses.map(addr => ({
        ...addr.toObject(),
        fullAddress: addr.getFullAddress ? addr.getFullAddress() : ''
      }))
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// SET PRIMARY ADDRESS
exports.setPrimaryAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    // Find client
    const client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Verify address ownership
    const address = await Address.findOne({ 
      _id: addressId, 
      clientId: client._id,
      isActive: true 
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Set as primary
    const updatedAddress = await Address.setPrimaryAddress(client._id, addressId);

    res.json({
      message: 'Primary address updated successfully',
      address: {
        ...updatedAddress.toObject(),
        fullAddress: updatedAddress.getFullAddress ? updatedAddress.getFullAddress() : ''
      }
    });
  } catch (error) {
    console.error('Set primary address error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};