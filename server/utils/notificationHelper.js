// backend/utils/notificationHelper.js
const notificationController = require('../controllers/notificationController');

/**
 * Send notification to a user
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - 'info' | 'warning' | 'success' | 'error'
 * @param {string} link - URL to navigate when clicked
 * @param {object} metadata - Additional data
 */
const sendNotification = async (userId, title, message, type = 'info', link = '', metadata = {}) => {
  return await notificationController.createNotification(userId, title, message, type, link, metadata);
};

module.exports = { sendNotification };