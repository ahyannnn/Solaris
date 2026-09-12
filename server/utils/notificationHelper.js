// backend/utils/notificationHelper.js
const notificationController = require('../controllers/notificationController');

/**
 * Send notification to a single user
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - 'info' | 'warning' | 'success' | 'error'
 * @param {string} link - URL to navigate when clicked
 * @param {object} metadata - Additional data
 * @param {boolean} isAdminBroadcast - Whether this is an admin broadcast
 */
const sendNotification = async (userId, title, message, type = 'info', link = '', metadata = {}, isAdminBroadcast = false) => {
  return await notificationController.createNotification(
    userId, 
    title, 
    message, 
    type, 
    link, 
    metadata, 
    isAdminBroadcast
  );
};

/**
 * Send admin broadcast notification to all admins
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - 'info' | 'warning' | 'success' | 'error'
 * @param {string} link - URL to navigate when clicked
 * @param {object} metadata - Additional data
 * @param {Array} adminIds - Array of admin user IDs (optional)
 */
const sendAdminBroadcast = async (title, message, type = 'info', link = '', metadata = {}, adminIds = null) => {
  return await notificationController.createAdminBroadcast(
    title, 
    message, 
    type, 
    link, 
    metadata, 
    adminIds
  );
};

/**
 * Send in-app broadcast notification to all customers (role 'user').
 * In-app only — never sends email.
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - 'info' | 'warning' | 'success' | 'error'
 * @param {string} link - URL to navigate when clicked
 * @param {object} metadata - Additional data
 */
const sendCustomerBroadcast = async (title, message, type = 'info', link = '', metadata = {}) => {
  return await notificationController.createCustomerBroadcast(
    title,
    message,
    type,
    link,
    metadata
  );
};

module.exports = { 
  sendNotification, 
  sendAdminBroadcast,
  sendCustomerBroadcast
};