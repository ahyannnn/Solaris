// controllers/userManagementControllers.js
const User = require('../models/Users');
const Client = require('../models/Clients');
const mongoose = require('mongoose');

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
          contactNumber: client.contactNumber,
          account_setup: client.account_setup,
          client_type: client.client_type
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

    // Create user
    const user = new User({
      fullName: fullName || `${firstName || ''} ${lastName || ''}`.trim(),
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      provider: 'local',
      role: role || 'user'
    });

    await user.save();

    // Create client record
    const client = new Client({
      userId: user._id,
      contactFirstName: firstName || '',
      contactLastName: lastName || '',
      contactNumber: contactNumber || '',
      account_setup: true
    });

    await client.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        clientInfo: {
          firstName: client.contactFirstName,
          lastName: client.contactLastName,
          contactNumber: client.contactNumber
        }
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
    const { role, fullName, firstName, lastName, contactNumber } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role) user.role = role;
    if (fullName) user.fullName = fullName;
    await user.save();

    // Update client info
    const client = await Client.findOne({ userId: user._id });
    if (client) {
      if (firstName) client.contactFirstName = firstName;
      if (lastName) client.contactLastName = lastName;
      if (contactNumber) client.contactNumber = contactNumber;
      await client.save();
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        clientInfo: client ? {
          firstName: client.contactFirstName,
          lastName: client.contactLastName,
          contactNumber: client.contactNumber
        } : null
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
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
// controllers/userManagementControllers.js - Update toggleUserStatus
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle the isActive status
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
// controllers/userManagementControllers.js - Update getUserStats
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

    // Count users with completed setup
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