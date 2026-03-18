// controllers/clientController.js
const Client = require('../models/Clients.js');

// Update client info (personal + address)
exports.updateClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Fix enum casing
    if (updateData.client_type) {
      updateData.client_type =
        updateData.client_type.charAt(0).toUpperCase() +
        updateData.client_type.slice(1).toLowerCase();
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
        runValidators: true
      }
    );

    res.json({
      message: "Client updated successfully",
      client
    });

  } catch (error) {
    console.error("Client update error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



// Get client info (check account_setup)

exports.getClientInfo = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT via authMiddleware

    const client = await Client.findOne({ userId }).populate('userId', 'email');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Transform the data to include email from the populated user
    const clientData = {
      ...client.toObject(),
      email: client.userId?.email || ''
    };

    res.json({ client: clientData });
  } catch (error) {
    console.error('Get client info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};