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
// LINK NORMALIZATION
// Older call sites send legacy links (/pre-assessment/:id, /payment,
// /free-quotes/:id, /projects/:id, /invoices/:id, /admin/...) that have
// no route in client/src/App.jsx, so toasts navigating to them landed
// on a dead blank page. Normalize every link to a real /app/... route
// before persisting, so old and new notifications always navigate.
// ============================================================

const normalizeNotificationLink = (rawLink, isAdminBroadcast = false) => {
  if (!rawLink || typeof rawLink !== 'string') return '';
  const trimmed = rawLink.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const queryIndex = trimmed.search(/[?#]/);
  const pathOnly = (queryIndex === -1 ? trimmed : trimmed.slice(0, queryIndex)) || '/';
  const suffix = queryIndex === -1 ? '' : trimmed.slice(queryIndex);
  const lowerPath = pathOnly.toLowerCase();

  // Fix known misspelled /app/... routes from older server code.
  if (lowerPath.includes('scheduleassessment')) {
    return isAdminBroadcast ? '/app/admin/siteassessment' : '/app/customer/book-assessment';
  }
  if (lowerPath.startsWith('/app/admin/pre-assessments')) {
    return '/app/admin/siteassessment' + suffix;
  }

  const VALID_PREFIXES = ['/app/admin/', '/app/engineer/', '/app/customer/', '/app/'];
  const isAppLink =
    lowerPath === '/app/admin' ||
    lowerPath === '/app/engineer' ||
    lowerPath === '/app/customer' ||
    VALID_PREFIXES.some((p) => lowerPath.startsWith(p));
  if (isAppLink) {
    // Already a real app route (e.g. /app/customer/support?tab=services).
    return trimmed;
  }

  const t = lowerPath;
  const isEngineerTarget = t.startsWith('/engineer/');

  if (isAdminBroadcast || t.startsWith('/admin/')) {
    if (t.includes('invoice') || t.includes('payment') || t.includes('billing') || t.includes('receipt')) return '/app/admin/billing';
    if (t.includes('project')) return '/app/admin/project';
    if (t.includes('pre-assessment') || t.includes('preassessment') || t.includes('booking') || t.includes('free-quote') || t.includes('freequote') || t.includes('quote') || t.includes('assessment')) return '/app/admin/siteassessment';
    if (t.includes('device') || t.includes('iot') || t.includes('hardware')) return '/app/admin/iotdevice';
    if (t.includes('schedule') || t.includes('appointment')) return '/app/admin/schedule';
    if (t.includes('service')) return '/app/admin/services';
    if (t.includes('user') || t.includes('client') || t.includes('customer')) return '/app/admin/usermanagement';
    if (t.includes('report') || t.includes('analytic')) return '/app/admin/reports';
    return '/app/admin/notifications';
  }

  if (isEngineerTarget) {
    if (t.includes('quotation') || t.includes('quote') || t.includes('billing') || t.includes('invoice') || t.includes('payment')) return '/app/engineer/quotation';
    if (t.includes('project')) return '/app/engineer/project';
    if (t.includes('schedule') || t.includes('appointment')) return '/app/engineer/schedule';
    if (t.includes('assessment')) return '/app/engineer/assessment';
    if (t.includes('device') || t.includes('iot')) return '/app/engineer/device';
    return '/app/engineer/notifications';
  }

  // Customer-targeted legacy links (default).
  if (t.includes('payment') || t.includes('invoice') || t.includes('billing') || t.includes('quote') || t.includes('receipt') || t.includes('fee')) return '/app/customer/billing';
  if (t.includes('project')) return '/app/customer/project';
  if (t.includes('assessment') || t.includes('booking') || t.includes('schedule') || t.includes('appointment')) return '/app/customer/book-assessment';
  if (t.includes('support') || t.includes('service') || t.includes('ticket')) return '/app/customer/support';
  if (t.includes('profile')) return '/app/customer/profile';
  if (t.includes('setting')) return '/app/customer/settings';
  return '/app/customer/notifications';
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

    const safeLink = normalizeNotificationLink(link, isAdminBroadcast);

    const notification =
      await Notification.create({
        userId,
        title,
        message,
        type,
        link: safeLink,
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

    const safeLink = normalizeNotificationLink(link, true);

    const notifications =
      admins.map((adminId) => ({
        userId: adminId,
        title,
        message,
        type,
        link: safeLink,
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
// CREATE CUSTOMER BROADCAST NOTIFICATION
// ============================================================
//
// Creates one in-app notification for every customer (role 'user').
// Used for app-wide announcements such as new APK releases.
// In-app only — never sends email.
//
// Also sends the notification immediately through Socket.IO.
//
// ============================================================

exports.createCustomerBroadcast = async (
  title,
  message,
  type = 'info',
  link = '',
  metadata = {}
) => {
  try {
    const customers =
      await User.find({
        role: 'user',
      }).select('_id');

    const customerIds = customers.map(
      (customer) => customer._id
    );

    if (
      !customerIds ||
      customerIds.length === 0
    ) {
      console.log(
        'No customer users found to send broadcast'
      );

      return [];
    }

    // ========================================================
    // CREATE NOTIFICATIONS
    // ========================================================

    const safeLink = normalizeNotificationLink(link, false);

    const notifications =
      customerIds.map((customerId) => ({
        userId: customerId,
        title,
        message,
        type,
        link: safeLink,
        metadata,
        isAdminBroadcast: false,
      }));

    const result =
      await Notification.insertMany(
        notifications
      );

    console.log(
      `✅ Customer broadcast saved for ${result.length} customers`
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
            `🔔 Customer broadcast sent to ${room}`
          );
        });
      }
    } catch (socketError) {
      console.error(
        'Socket customer broadcast error:',
        socketError
      );
    }

    return result;
  } catch (error) {
    console.error(
      'Error creating customer broadcast:',
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