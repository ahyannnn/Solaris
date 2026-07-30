// src/pages/Auth/notification.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTrash,
  FaClock,
  FaExclamationCircle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimes,
  FaSlidersH,
  FaInbox,
  FaCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Auth/notification.css';

const Notifications = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectMode, setSelectMode] = useState(false);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 'single' or 'bulk'
  const [modalTargetId, setModalTargetId] = useState(null);
  const [modalCount, setModalCount] = useState(0);

  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

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

  const markAsRead = async (notificationId) => {
    try {
      const token = getToken();
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const notification = notifications.find(n => n._id === notificationId);
      const wasUnread = notification && !notification.read;

      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, read: true }
            : notif
        )
      );

      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getToken();
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // ---- DELETE LOGIC WITH MODAL ----
  const openDeleteModal = (notificationId) => {
    setModalAction('single');
    setModalTargetId(notificationId);
    setModalCount(1);
    setShowConfirmModal(true);
  };

  const openBulkDeleteModal = () => {
    if (selectedNotifications.length === 0) return;
    setModalAction('bulk');
    setModalTargetId(null);
    setModalCount(selectedNotifications.length);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = getToken();

      if (modalAction === 'single') {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/notifications/${modalTargetId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const deleted = notifications.find(n => n._id === modalTargetId);
        setNotifications(prev => prev.filter(notif => notif._id !== modalTargetId));
        if (deleted && !deleted.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        showToast('Notification deleted successfully.', 'success');
      } else if (modalAction === 'bulk') {
        await Promise.all(
          selectedNotifications.map(id =>
            axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        );

        const deletedIds = new Set(selectedNotifications);
        const deletedUnread = notifications.filter(
          n => deletedIds.has(n._id) && !n.read
        ).length;

        setNotifications(prev => prev.filter(n => !deletedIds.has(n._id)));
        setSelectedNotifications([]);
        setSelectMode(false);
        setUnreadCount(prev => Math.max(0, prev - deletedUnread));
        showToast(`${modalCount} notification(s) deleted successfully.`, 'success');
      }
    } catch (err) {
      console.error('Error deleting notification(s):', err);
      showToast('Failed to delete notification(s).', 'error');
    } finally {
      setShowConfirmModal(false);
      setModalAction(null);
      setModalTargetId(null);
      setModalCount(0);
    }
  };

  const closeModal = () => {
    setShowConfirmModal(false);
    setModalAction(null);
    setModalTargetId(null);
    setModalCount(0);
  };

  const toggleSelection = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n._id));
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

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

    if (diffYear > 0) return `${diffYear}y`;
    if (diffMonth > 0) return `${diffMonth}m`;
    if (diffDay > 0) return diffDay === 1 ? '1d' : `${diffDay}d`;
    if (diffHour > 0) return `${diffHour}h`;
    if (diffMin > 0) return `${diffMin}m`;
    return 'now';
  };

  const getFullTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'info': return <FaInfoCircle className="notif-icon-info" />;
      case 'warning': return <FaExclamationCircle className="notif-icon-warning" />;
      case 'success': return <FaCheckCircle className="notif-icon-success" />;
      case 'error': return <FaTimes className="notif-icon-error" />;
      default: return <FaBell className="notif-icon-default" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'info': return 'icon-bg-info';
      case 'warning': return 'icon-bg-warning';
      case 'success': return 'icon-bg-success';
      case 'error': return 'icon-bg-error';
      default: return 'icon-bg-default';
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="notif-page">
        <div className="notif-loading">
          <div className="notif-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notif-page">
      <div className="notif-wrapper">
        {/* Header */}
        <header className="notif-header">
          <div className="notif-header-left">
            <div className="notif-header-icon-wrapper">
              <FaBell className="notif-header-icon" />
              {unreadCount > 0 && <span className="notif-header-dot"></span>}
            </div>
            <div>
              <h2>Notifications</h2>
              <p className="notif-subtitle">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="notif-header-right">
            {notifications.length > 0 && (
              <>
                <button
                  className={`notif-select-btn ${selectMode ? 'active' : ''}`}
                  onClick={() => {
                    setSelectMode(!selectMode);
                    if (selectMode) setSelectedNotifications([]);
                  }}
                >
                  <FaSlidersH />
                  <span>Select</span>
                </button>
                {unreadCount > 0 && (
                  <button className="notif-mark-all-btn" onClick={markAllAsRead}>
                    <FaCheckDouble />
                    <span>Mark all read</span>
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        {/* Bulk Actions */}
        {selectMode && selectedNotifications.length > 0 && (
          <div className="notif-bulk-actions">
            <span className="bulk-count">{selectedNotifications.length} selected</span>
            <div className="bulk-actions-group">
              <button onClick={openBulkDeleteModal} className="bulk-delete-btn">
                <FaTrash /> Delete selected
              </button>
              <button onClick={selectAll} className="bulk-select-btn">
                {selectedNotifications.length === filteredNotifications.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="notif-filters">
          <div className="notif-filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
              <span className="filter-count">{notifications.length}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              <FaCircle className="filter-unread-dot" />
              Unread
              <span className="filter-count unread-count">{unreadCount}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              Read
              <span className="filter-count">{notifications.length - unreadCount}</span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="notif-error">
            <FaExclamationCircle />
            <p>{error}</p>
            <button onClick={fetchNotifications}>Retry</button>
          </div>
        )}

        {/* List */}
        {filteredNotifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon-wrapper">
              <FaInbox className="notif-empty-icon" />
            </div>
            <h3>No notifications</h3>
            <p>You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          <div className="notif-list">
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification._id}
                className={`notif-item ${!notification.read ? 'unread' : ''} ${selectedNotifications.includes(notification._id) ? 'selected' : ''}`}
              >
                {/* Selection checkbox */}
                {selectMode && (
                  <div className="notif-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification._id)}
                      onChange={() => toggleSelection(notification._id)}
                      className="notif-checkbox"
                      id={`notif-${notification._id}`}
                    />
                    <label htmlFor={`notif-${notification._id}`}></label>
                  </div>
                )}

                {/* Icon */}
                <div className={`notif-icon-wrapper ${getIconBg(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="notif-content">
                  <div className="notif-content-header">
                    <div className="notif-title-wrapper">
                      <h4 className="notif-title">{notification.title}</h4>
                      {!notification.read && (
                        <span className="notif-unread-label">New</span>
                      )}
                    </div>
                    <div className="notif-time-wrapper">
                      <span className="notif-time-ago">{getTimeAgo(notification.createdAt)}</span>
                      <span className="notif-time-separator">·</span>
                      <span className="notif-time-full">{getFullTime(notification.createdAt)}</span>
                    </div>
                  </div>
                  <p className="notif-message">{notification.message}</p>
                  {!notification.read && (
                    <div className="notif-footer">
                      <button
                        className="notif-mark-read-btn"
                        onClick={() => markAsRead(notification._id)}
                      >
                        <FaCheck /> Mark as read
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!selectMode && (
                  <div className="notif-actions">
                    <button
                      className="notif-delete-btn"
                      onClick={() => openDeleteModal(notification._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer stats */}
        {notifications.length > 0 && (
          <div className="notif-footer-stats">
            <span className="notif-stats">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </span>
          </div>
        )}
      </div>

      {/* ============================================
          DELETE CONFIRMATION MODAL
         ============================================ */}
      {showConfirmModal && (
        <div className="notif-modal-overlay" onClick={closeModal}>
          <div className="notif-modal-content" onClick={e => e.stopPropagation()}>
            <div className="notif-modal-header">
              <h3>Confirm Delete</h3>
            </div>
            <div className="notif-modal-body">
              <div className="notif-modal-icon-wrapper">
                <FaExclamationTriangle className="notif-modal-icon" />
              </div>
              <p className="notif-modal-text">
                Are you sure you want to delete <strong>{modalCount}</strong> notification{modalCount > 1 ? 's' : ''}?
              </p>
              <p className="notif-modal-subtext">This action cannot be undone.</p>
            </div>
            <div className="notif-modal-actions">
              <button className="notif-modal-cancel-btn" onClick={closeModal}>
                Cancel
              </button>
              <button className="notif-modal-confirm-btn" onClick={handleConfirmDelete}>
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastNotification 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={hideToast} 
        position="bottom-left"
      />
    </div>
  );
};

export default Notifications;