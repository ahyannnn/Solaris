// controllers/userManagementControllers.js
const User = require('../models/Users');
const Client = require('../models/Clients');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);
    
    // Get client info for each user
    const usersWithClientInfo = await Promise.all(users.map(async (user) => {
      const client = await Client.findOne({ userId: user._id });
      return {
        ...user.toObject(),
        clientInfo: client ? {
          firstName: client.contactFirstName,
          lastName: client.contactLastName,
          middleName: client.contactMiddleName,
          contactNumber: client.contactNumber,
          birthday: client.birthday,
          companyName: client.companyName,
          client_type: client.client_type,
          account_setup: client.account_setup
        } : null
      };
    }));

    res.json({
      success: true,
      users: usersWithClientInfo,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const client = await Client.findOne({ userId: user._id });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        clientInfo: client ? {
          firstName: client.contactFirstName,
          lastName: client.contactLastName,
          middleName: client.contactMiddleName,
          contactNumber: client.contactNumber,
          birthday: client.birthday,
          companyName: client.companyName,
          client_type: client.client_type,
          account_setup: client.account_setup
        } : null
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
  try {
    const { email, password, role, fullName, firstName, lastName, contactNumber } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user with hashed password
    const user = new User({
      fullName: fullName || `${firstName || ''} ${lastName || ''}`.trim(),
      email,
      passwordHash,
      provider: 'local',
      role: role || 'user'
    });

    await user.save();

    // Only create client record for users with role 'user' (customers)
    if (role === 'user' || (!role && role !== 'admin' && role !== 'engineer')) {
      const client = new Client({
        userId: user._id,
        contactFirstName: firstName || '',
        contactLastName: lastName || '',
        contactNumber: contactNumber || '',
        client_type: 'Residential',
        account_setup: false
      });
      await client.save();
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        clientInfo: (role === 'user') ? {
          firstName: firstName || '',
          lastName: lastName || '',
          contactNumber: contactNumber || ''
        } : null
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, firstName, lastName, contactNumber } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    if (fullName) user.fullName = fullName;
    await user.save();

    // Only update client info for users with role 'user' (customers)
    if (user.role === 'user') {
      const client = await Client.findOne({ userId: user._id });
      if (client) {
        let needsSave = false;
        
        if (firstName !== undefined && firstName !== client.contactFirstName) {
          client.contactFirstName = firstName;
          needsSave = true;
        }
        if (lastName !== undefined && lastName !== client.contactLastName) {
          client.contactLastName = lastName;
          needsSave = true;
        }
        if (contactNumber !== undefined && contactNumber !== client.contactNumber) {
          client.contactNumber = contactNumber;
          needsSave = true;
        }
        
        if (needsSave) {
          await client.save();
        }
      } else if (firstName || lastName || contactNumber) {
        const newClient = new Client({
          userId: user._id,
          contactFirstName: firstName || '',
          contactLastName: lastName || '',
          contactNumber: contactNumber || '',
          client_type: 'Residential',
          account_setup: false
        });
        await newClient.save();
      }
    }

    // Fetch updated user with client info
    const updatedUser = await User.findById(id).select('-passwordHash');
    const updatedClient = await Client.findOne({ userId: user._id });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
        clientInfo: updatedClient ? {
          firstName: updatedClient.contactFirstName,
          lastName: updatedClient.contactLastName,
          contactNumber: updatedClient.contactNumber,
          client_type: updatedClient.client_type
        } : null
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user', 
      error: error.message 
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'engineer', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

// @desc    Toggle user status (soft delete / activate)
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Failed to toggle user status', error: error.message });
  }
};

// @desc    Reset user password (Admin only)
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (Admin)
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password
    user.passwordHash = passwordHash;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reset password', 
      error: error.message 
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated client record
    await Client.findOneAndDelete({ userId: id });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// @desc    Get dashboard user stats
// @route   GET /api/admin/users/stats
// @access  Private (Admin)
exports.getUserStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const total = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });
    
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const clientsWithSetup = await Client.countDocuments({ account_setup: true });
    const usersWithSetup = clientsWithSetup;

    res.json({
      success: true,
      total,
      activeUsers,
      inactiveUsers,
      newThisMonth,
      usersWithSetup,
      byRole: byRole.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user stats', error: error.message });
  }
};