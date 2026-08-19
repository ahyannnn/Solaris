// backend/controllers/notificationController.js
const Notification = require('../models/Notification');
const User = require('../models/Users');
const mongoose = require('mongoose');

// Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Notification.countDocuments({ userId });
    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
    });
  }
};

// Mark a single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Notification.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
    });
  }
};

// ✅ UPDATED: Helper function to create notification with isAdminBroadcast support
exports.createNotification = async (userId, title, message, type = 'info', link = '', metadata = {}, isAdminBroadcast = false) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
      metadata,
      isAdminBroadcast, // Add this field
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// ✅ NEW: Create admin broadcast notification for all admins
exports.createAdminBroadcast = async (title, message, type = 'info', link = '', metadata = {}, adminIds = null) => {
  try {
    let admins = adminIds;
    
    // If adminIds not provided, fetch all admin users
    if (!admins) {
      const adminUsers = await User.find({ 
        role: { $in: ['super_admin', 'admin', 'finance_admin', 'operations_admin'] }
      }).select('_id');
      admins = adminUsers.map(admin => admin._id);
    }

    if (!admins || admins.length === 0) {
      console.log('No admin users found to send broadcast');
      return [];
    }

    // Create notifications for all admins
    const notifications = admins.map(adminId => ({
      userId: adminId,
      title,
      message,
      type,
      link,
      metadata,
      isAdminBroadcast: true // Set to true for admin broadcasts
    }));

    const result = await Notification.insertMany(notifications);
    console.log(`✅ Admin broadcast sent to ${result.length} admins`);
    return result;
  } catch (error) {
    console.error('Error creating admin broadcast:', error);
    return [];
  }
};

// ✅ NEW: Get admin broadcast notifications for a specific admin
exports.getAdminBroadcasts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;

    const notifications = await Notification.find({ 
      userId, 
      isAdminBroadcast: true 
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({ 
      userId, 
      isAdminBroadcast: true 
    });
    
    const unreadCount = await Notification.countDocuments({
      userId,
      isAdminBroadcast: true,
      read: false
    });

    res.status(200).json({
      success: true,
      notifications,
      total,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching admin broadcasts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin broadcasts',
    });
  }
};

// ✅ NEW: Get unread admin broadcast count for a specific admin
exports.getUnreadAdminBroadcastCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({
      userId,
      isAdminBroadcast: true,
      read: false
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error getting unread admin broadcast count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread admin broadcast count',
    });
  }
};