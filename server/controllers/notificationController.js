// backend/controllers/notificationController.js

const Notification = require('../models/Notification');
const User = require('../models/Users');
const mongoose = require('mongoose');

const { getIO } = require('../socket');

// ============================================================
// GET ALL NOTIFICATIONS FOR LOGGED-IN USER
// ============================================================

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const skip =
      (parseInt(page) - 1) * parseInt(limit);

    const limitNum = parseInt(limit);

    const notifications = await Notification.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total =
      await Notification.countDocuments({
        userId,
      });

    const unreadCount =
      await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,

      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(
          total / limitNum
        ),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error(
      'Error fetching notifications:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
    });
  }
};

// ============================================================
// GET UNREAD NOTIFICATION COUNT
// ============================================================

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count =
      await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(
      'Error getting unread count:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
    });
  }
};

// ============================================================
// MARK SINGLE NOTIFICATION AS READ
// ============================================================

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    const notification =
      await Notification.findOne({
        _id: id,
        userId,
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Check if it was unread BEFORE marking it read
    const wasUnread = !notification.read;

    await notification.markAsRead();

    // ========================================================
    // REAL-TIME READ EVENT
    // ========================================================

    if (wasUnread) {
      try {
        const io = getIO();

        if (io) {
          io.to(`user:${userId}`).emit(
            'notification:read',
            {
              notificationId: id,
            }
          );
        }
      } catch (socketError) {
        console.error(
          'Socket read event error:',
          socketError
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error(
      'Error marking notification as read:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
    });
  }
};

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result =
      await Notification.markAllAsRead(userId);

    // ========================================================
    // REAL-TIME READ ALL EVENT
    // ========================================================

    try {
      const io = getIO();

      if (io) {
        io.to(`user:${userId}`).emit(
          'notifications:readAll'
        );
      }
    } catch (socketError) {
      console.error(
        'Socket read-all event error:',
        socketError
      );
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(
      'Error marking all notifications as read:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
    });
  }
};

// ============================================================
// DELETE NOTIFICATION
// ============================================================

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    const notification =
      await Notification.findOneAndDelete({
        _id: id,
        userId,
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // ========================================================
    // REAL-TIME DELETE EVENT
    // Only decrease count if deleted notification was unread
    // ========================================================

    if (!notification.read) {
      try {
        const io = getIO();

        if (io) {
          io.to(`user:${userId}`).emit(
            'notification:deleted',
            {
              notificationId: id,
            }
          );
        }
      } catch (socketError) {
        console.error(
          'Socket delete event error:',
          socketError
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error(
      'Error deleting notification:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
    });
  }
};

// ============================================================
// CREATE NOTIFICATION
// ============================================================
//
// This is the IMPORTANT PART for REAL-TIME notifications.
//
// 1. Save notification to MongoDB
// 2. Emit notification:new to the specific user
//
// ============================================================

exports.createNotification = async (
  userId,
  title,
  message,
  type = 'info',
  link = '',
  metadata = {},
  isAdminBroadcast = false
) => {
  try {
    // ========================================================
    // SAVE TO DATABASE
    // ========================================================

    const notification =
      await Notification.create({
        userId,
        title,
        message,
        type,
        link,
        metadata,
        isAdminBroadcast,
      });

    console.log(
      `✅ Notification created for user ${userId}`
    );

    // ========================================================
    // REAL-TIME SOCKET EVENT
    // ========================================================

    try {
      const io = getIO();

      if (io) {
        const room = `user:${userId}`;

        io.to(room).emit(
          'notification:new',
          {
            notification:
              notification.toObject(),
          }
        );

        console.log(
          `🔔 Real-time notification sent to ${room}`
        );
      }
    } catch (socketError) {
      // Socket failure should NOT break notification creation
      console.error(
        'Socket notification error:',
        socketError
      );
    }

    return notification;
  } catch (error) {
    console.error(
      'Error creating notification:',
      error
    );

    return null;
  }
};

// ============================================================
// CREATE ADMIN BROADCAST NOTIFICATION
// ============================================================
//
// Creates one notification for every admin.
//
// Also sends the notification immediately through Socket.IO.
//
// ============================================================

exports.createAdminBroadcast = async (
  title,
  message,
  type = 'info',
  link = '',
  metadata = {},
  adminIds = null
) => {
  try {
    let admins = adminIds;

    // ========================================================
    // GET ALL ADMINS IF ADMIN IDS WERE NOT PROVIDED
    // ========================================================

    if (!admins) {
      const adminUsers =
        await User.find({
          role: {
            $in: [
              'super_admin',
              'admin',
              'finance_admin',
              'operations_admin',
            ],
          },
        }).select('_id');

      admins = adminUsers.map(
        (admin) => admin._id
      );
    }

    if (
      !admins ||
      admins.length === 0
    ) {
      console.log(
        'No admin users found to send broadcast'
      );

      return [];
    }

    // ========================================================
    // CREATE NOTIFICATIONS
    // ========================================================

    const notifications =
      admins.map((adminId) => ({
        userId: adminId,
        title,
        message,
        type,
        link,
        metadata,
        isAdminBroadcast: true,
      }));

    const result =
      await Notification.insertMany(
        notifications
      );

    console.log(
      `✅ Admin broadcast saved for ${result.length} admins`
    );

    // ========================================================
    // REAL-TIME SOCKET BROADCAST
    // ========================================================

    try {
      const io = getIO();

      if (io) {
        result.forEach((notification) => {
          const room =
            `user:${notification.userId}`;

          io.to(room).emit(
            'notification:new',
            {
              notification:
                notification.toObject(),
            }
          );

          console.log(
            `🔔 Admin broadcast sent to ${room}`
          );
        });
      }
    } catch (socketError) {
      console.error(
        'Socket admin broadcast error:',
        socketError
      );
    }

    return result;
  } catch (error) {
    console.error(
      'Error creating admin broadcast:',
      error
    );

    return [];
  }
};

// ============================================================
// GET ADMIN BROADCAST NOTIFICATIONS
// ============================================================

exports.getAdminBroadcasts = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      limit = 50,
      skip = 0,
    } = req.query;

    const notifications =
      await Notification.find({
        userId,
        isAdminBroadcast: true,
      })
        .sort({
          createdAt: -1,
        })
        .skip(parseInt(skip))
        .limit(parseInt(limit));

    const total =
      await Notification.countDocuments({
        userId,
        isAdminBroadcast: true,
      });

    const unreadCount =
      await Notification.countDocuments({
        userId,
        isAdminBroadcast: true,
        read: false,
      });

    res.status(200).json({
      success: true,
      notifications,
      total,
      unreadCount,
    });
  } catch (error) {
    console.error(
      'Error fetching admin broadcasts:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        'Error fetching admin broadcasts',
    });
  }
};

// ============================================================
// GET UNREAD ADMIN BROADCAST COUNT
// ============================================================

exports.getUnreadAdminBroadcastCount =
  async (req, res) => {
    try {
      const userId = req.user.id;

      const count =
        await Notification.countDocuments({
          userId,
          isAdminBroadcast: true,
          read: false,
        });

      res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      console.error(
        'Error getting unread admin broadcast count:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Error getting unread admin broadcast count',
      });
    }
  };