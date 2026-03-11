// controllers/clientController.js
const Client = require('../models/Clients.js');

// Update client info (personal + address)
exports.updateClient = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT via authMiddleware
    const updateData = req.body;

    // Ensure client exists
    let client = await Client.findOne({ userId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Update client
    client = await Client.findOneAndUpdate({ userId }, updateData, { returnDocument: 'after', // ✅ replaces new: true
        runValidators: true   });

    res.json({ message: 'Client updated successfully', client });
  } catch (error) {
    console.error('Client update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Get client info (check account_setup)
exports.getClientInfo = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT via authMiddleware

    const client = await Client.findOne({ userId });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Get client info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};