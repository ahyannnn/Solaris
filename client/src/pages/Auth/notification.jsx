// src/pages/Auth/notification.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBell, FaCheck, FaCheckDouble, FaTrash, FaClock, FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';
import '../../styles/Auth/notification.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get auth token
  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setError('');
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      const token = getToken();
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = getToken();
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;

    try {
      const token = getToken();
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      const deleted = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // 🔴 REMOVED: handleNotificationClick - no longer navigates

  // Get time ago
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffMonth / 12);

    if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
    if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    if (diffDay > 0) return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Get notification icon
  const getIcon = (type) => {
    switch (type) {
      case 'info': return <FaInfoCircle className="notif-icon-info" />;
      case 'warning': return <FaExclamationCircle className="notif-icon-warning" />;
      case 'success': return <FaCheckCircle className="notif-icon-success" />;
      case 'error': return <FaTimes className="notif-icon-error" />;
      default: return <FaBell className="notif-icon-default" />;
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="notif-loading">
          <div className="notif-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notif-header">
        <div className="notif-header-left">
          <FaBell className="notif-header-icon" />
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <span className="notif-unread-badge">{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="notif-mark-all-btn" onClick={markAllAsRead}>
            <FaCheckDouble /> Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="notif-error">
          <p>{error}</p>
          <button onClick={fetchNotifications}>Retry</button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="notif-empty">
          <FaBell className="notif-empty-icon" />
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notif-item ${!notification.read ? 'notif-unread' : ''}`}
              // 🔴 REMOVED: onClick handler - no longer clickable
            >
              <div className="notif-icon-wrapper">
                {getIcon(notification.type)}
              </div>
              <div className="notif-content">
                <div className="notif-content-header">
                  <h4 className="notif-title">{notification.title}</h4>
                  <span className="notif-time">
                    <FaClock className="notif-time-icon" />
                    {getTimeAgo(notification.createdAt)}
                  </span>
                </div>
                <p className="notif-message">{notification.message}</p>
                {!notification.read && (
                  <span className="notif-unread-indicator">Unread</span>
                )}
              </div>
              <div className="notif-actions">
                {!notification.read && (
                  <button
                    className="notif-mark-read-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification._id);
                    }}
                    title="Mark as read"
                  >
                    <FaCheck />
                  </button>
                )}
                <button
                  className="notif-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification._id);
                  }}
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;