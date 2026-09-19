// src/pages/Auth/notification.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaArrowLeft,
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
  FaExclamationTriangle,
  FaBullhorn,
  FaEllipsisV,
  FaEye,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import socketService from '../../services/socketService';
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
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Paging: fetch 10 at a time to avoid loading thousands of docs
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const currentPageRef = useRef(1);
  currentPageRef.current = currentPage;

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalTargetId, setModalTargetId] = useState(null);
  const [modalCount, setModalCount] = useState(0);

  const dropdownRef = useRef(null);

  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const getUserRole = () => {
    return localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
  };



  // Mobile back button target (role dashboard)
  const getDashboardPath = () => {
    const role = getUserRole();
    if (role === 'admin') return '/app/admin';
    if (role === 'engineer') return '/app/engineer';
    return '/app/customer';
  };

  // Real-time socket events (paged: only prepend on page 1 to avoid shifting pages 2+)
  useEffect(() => {
    const handleNewNotification = (data) => {
      const notification = data?.notification || data;
      if (!notification?._id) return;

      setTotalItems((prev) => {
        const next = prev + 1;
        setTotalPages(Math.max(1, Math.ceil(next / PAGE_SIZE)));
        return next;
      });
      setUnreadCount((prev) => prev + 1);

      // Only mutate the visible list on page 1; other pages refetch on navigation
      if (currentPageRef.current !== 1) return;

      setNotifications((prev) => {
        // Prevent duplicate entry in list
        if (prev.some((n) => n._id === notification._id)) {
          return prev;
        }
        // Keep page size stable at 10
        return [notification, ...prev].slice(0, PAGE_SIZE);
      });
    };

    const handleNotificationRead = (data) => {
      const notifId = data?.notificationId;
      if (!notifId) return;

      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, read: true, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleReadAll = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      setUnreadCount(0);
    };

    const handleNotificationDeleted = (data) => {
      const notifId = data?.notificationId;
      if (!notifId) return;

      setNotifications((prev) => {
        const target = prev.find((n) => n._id === notifId);
        if (!target) return prev;
        if (!target.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        setTotalItems((c) => {
          const next = Math.max(0, c - 1);
          setTotalPages(Math.max(1, Math.ceil(next / PAGE_SIZE)));
          return next;
        });
        return prev.filter((n) => n._id !== notifId);
      });
    };

    socketService.on('notification:new', handleNewNotification);
    socketService.on('notification:read', handleNotificationRead);
    socketService.on('notifications:readAll', handleReadAll);
    socketService.on('notification:deleted', handleNotificationDeleted);

    return () => {
      socketService.off('notification:new', handleNewNotification);
      socketService.off('notification:read', handleNotificationRead);
      socketService.off('notifications:readAll', handleReadAll);
      socketService.off('notification:deleted', handleNotificationDeleted);
    };
  }, []);

  const fetchNotifications = async (page = currentPageRef.current) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: PAGE_SIZE }
      });

      console.log('Notifications data:', response.data);
      // Guard: never render more than one page even if the API returns extra rows
      const pageItems = (response.data.notifications || []).slice(0, PAGE_SIZE);
      setNotifications(pageItems);
      setUnreadCount(response.data.unreadCount || 0);
      if (response.data.pagination) {
        setCurrentPage(response.data.pagination.currentPage || page);
        setTotalPages(response.data.pagination.totalPages || 1);
        setTotalItems(response.data.pagination.totalItems || 0);
      } else {
        // Fallback for servers without pagination metadata
        setCurrentPage(page);
        setTotalItems((prev) => Math.max(prev, pageItems.length));
        setTotalPages((prev) => Math.max(prev, pageItems.length >= PAGE_SIZE ? page + 1 : page));
      }
      setSelectedNotifications([]);
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
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Error marking all as read:', err);
      showToast('Failed to mark all as read', 'error');
    }
  };

  // Delete logic with modal
  const openDeleteModal = (notificationId) => {
    setModalAction('single');
    setModalTargetId(notificationId);
    setModalCount(1);
    setShowConfirmModal(true);
    setActiveDropdown(null);
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
        const remaining = notifications.filter(notif => notif._id !== modalTargetId);
        setNotifications(remaining);
        setTotalItems((prev) => {
          const next = Math.max(0, prev - 1);
          setTotalPages(Math.max(1, Math.ceil(next / PAGE_SIZE)));
          return next;
        });
        if (deleted && !deleted.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        // If the page is now empty and we are past page 1, step back (effect refetches)
        if (remaining.length === 0 && currentPageRef.current > 1) {
          setCurrentPage((p) => Math.max(1, p - 1));
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
        const remaining = notifications.filter(n => !deletedIds.has(n._id));

        setNotifications(remaining);
        setTotalItems((prev) => {
          const next = Math.max(0, prev - deletedIds.size);
          setTotalPages(Math.max(1, Math.ceil(next / PAGE_SIZE)));
          return next;
        });
        setSelectedNotifications([]);
        setSelectMode(false);
        setUnreadCount(prev => Math.max(0, prev - deletedUnread));
        if (remaining.length === 0 && currentPageRef.current > 1) {
          setCurrentPage((p) => Math.max(1, p - 1));
        }
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

  // ============================================
  // NAVIGATION - BASED ON ACTUAL APP ROUTES
  // ============================================
  const handleViewNotification = (notification) => {
    // Mark as read when viewing
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    const userRole = getUserRole() || 'user';
    
    const type = notification.metadata?.type || notification.type || notification.notificationType || '';
    const title = notification.title?.toLowerCase() || '';
    const message = notification.message?.toLowerCase() || '';
    const source = notification.metadata?.source || notification.source || '';
    const combinedText = `${type} ${title} ${message} ${source}`.toLowerCase();
    
    let path = '/app/customer/notifications';

    // ===== ADMIN ROUTES =====
    if (userRole === 'admin') {
      if (combinedText.includes('billing') || combinedText.includes('invoice') || combinedText.includes('payment') || combinedText.includes('bill') || combinedText.includes('receipt')) {
        path = '/app/admin/billing';
      } else if (combinedText.includes('solarinvoice') || combinedText.includes('solar invoice')) {
        path = '/app/admin/solarinvoices';
      } else if (combinedText.includes('project')) {
        path = '/app/admin/project';
      } else if (combinedText.includes('pre-assessment') || combinedText.includes('preassessment') || 
                 combinedText.includes('booking') || combinedText.includes('free quote') || 
                 combinedText.includes('freequote') || combinedText.includes('quote') || 
                 combinedText.includes('site assessment') || combinedText.includes('siteassessment') ||
                 combinedText.includes('assessment')) {
        // LAHAT NG QUOTES, PRE-ASSESSMENTS, SITE ASSESSMENTS DITO
        path = '/app/admin/siteassessment';
      } else if (combinedText.includes('user') || combinedText.includes('client') || combinedText.includes('customer')) {
        path = '/app/admin/usermanagement';
      } else if (combinedText.includes('device') || combinedText.includes('iot') || combinedText.includes('hardware')) {
        path = '/app/admin/iotdevice';
      } else if (combinedText.includes('report') || combinedText.includes('analytics')) {
        path = '/app/admin/reports';
      } else if (combinedText.includes('schedule') || combinedText.includes('appointment')) {
        path = '/app/admin/schedule';
      } else if (combinedText.includes('maintenance')) {
        path = '/app/admin/maintenance';
      } else if (combinedText.includes('settings') || combinedText.includes('config')) {
        path = '/app/admin/settings';
      } else if (combinedText.includes('system')) {
        path = '/app/admin/system-config';
      } else {
        path = '/app/admin/notifications';
      }
    }
    // ===== ENGINEER ROUTES =====
    else if (userRole === 'engineer') {
      if (combinedText.includes('quotation') || combinedText.includes('billing') || combinedText.includes('invoice') || combinedText.includes('payment')) {
        path = '/app/engineer/quotation';
      } else if (combinedText.includes('project')) {
        path = '/app/engineer/project';
      } else if (combinedText.includes('schedule') || combinedText.includes('appointment')) {
        path = '/app/engineer/schedule';
      } else if (combinedText.includes('assessment') || combinedText.includes('site assessment')) {
        path = '/app/engineer/assessment';
      } else if (combinedText.includes('device') || combinedText.includes('iot')) {
        path = '/app/engineer/device';
      } else if (combinedText.includes('report') || combinedText.includes('analytics')) {
        path = '/app/engineer/reports';
      } else if (combinedText.includes('profile')) {
        path = '/app/engineer/profile';
      } else {
        path = '/app/engineer/notifications';
      }
    }
    // ===== CUSTOMER ROUTES =====
    else {
      if (combinedText.includes('quotation') || combinedText.includes('billing') || combinedText.includes('invoice') || combinedText.includes('payment') || combinedText.includes('bill') || combinedText.includes('receipt') || combinedText.includes('fee')) {
        path = '/app/customer/billing';
      } else if (combinedText.includes('project') || combinedText.includes('installation') || combinedText.includes('solar')) {
        path = '/app/customer/project';
      } else if (combinedText.includes('schedule') || combinedText.includes('assessment') || combinedText.includes('booking') || combinedText.includes('appointment') || combinedText.includes('pre-assessment')) {
        path = '/app/customer/book-assessment';
      } else if (combinedText.includes('support') || combinedText.includes('ticket') || combinedText.includes('help') || combinedText.includes('inquiry')) {
        path = '/app/customer/support';
      } else if (combinedText.includes('profile')) {
        path = '/app/customer/profile';
      } else if (combinedText.includes('settings')) {
        path = '/app/customer/settings';
      } else {
        path = '/app/customer/notifications';
      }
    }

    console.log('Navigating to:', path);
    setActiveDropdown(null);
    navigate(path);
  };

  const toggleDropdown = (notificationId, event) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === notificationId ? null : notificationId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
      case 'broadcast':
        return notifications.filter(n => n.isAdminBroadcast === true);
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

  const getBroadcastCount = () => {
    return notifications.filter(n => n.isAdminBroadcast === true).length;
  };

  // Pagination (same design as schedule module: page numbers + Previous/Next)
  const startItem = totalItems > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleFilterChange = (next) => {
    setFilter(next);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    const next = Math.min(Math.max(1, page), Math.max(1, totalPages));
    if (next === currentPage) return;
    setSelectedNotifications([]);
    setSelectMode(false);
    setCurrentPage(next);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage);
    const interval = setInterval(() => fetchNotifications(currentPageRef.current), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Only full-screen spinner on first load; page turns + polls keep the list visible
  if (loading && notifications.length === 0 && totalItems === 0) {
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
            {/* Mobile only: back to dashboard */}
            <button className="notif-back-btn" onClick={() => navigate(getDashboardPath())} aria-label="Back to dashboard">
              <FaArrowLeft />
            </button>
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
            {(totalItems > 0 || notifications.length > 0) && (
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

        {/* Filters (counts are global; list filter applies to the loaded page) */}
        <div className="notif-filters">
          <div className="notif-filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
              <span className="filter-count">{totalItems}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => handleFilterChange('unread')}
            >
              {unreadCount > 0 && <FaCircle className="filter-unread-dot" />}
              Unread
              <span className={`filter-count ${unreadCount > 0 ? 'unread-count' : ''}`}>{unreadCount}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
              onClick={() => handleFilterChange('read')}
            >
              Read
              <span className="filter-count">{Math.max(0, totalItems - unreadCount)}</span>
            </button>
            {getBroadcastCount() > 0 && (
              <button
                className={`filter-tab ${filter === 'broadcast' ? 'active' : ''}`}
                onClick={() => handleFilterChange('broadcast')}
                title="Broadcasts on this page"
              >
                <FaBullhorn className="filter-broadcast-icon" />
                Broadcast
                <span className="filter-count broadcast-count">{getBroadcastCount()}</span>
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="notif-error">
            <FaExclamationCircle />
            <p>{error}</p>
            <button onClick={() => fetchNotifications(currentPage)}>Retry</button>
          </div>
        )}

        {/* List */}
        {filteredNotifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon-wrapper">
              <FaInbox className="notif-empty-icon" />
            </div>
            <h3>No notifications on this page</h3>
            <p>{totalItems > 0 ? 'Try another page or filter.' : "You're all caught up! Check back later for updates."}</p>
          </div>
        ) : (
          <div className="notif-list">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`notif-item ${!notification.read ? 'unread' : ''} ${selectedNotifications.includes(notification._id) ? 'selected' : ''} ${notification.isAdminBroadcast ? 'broadcast' : ''}`}
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

                {/* Icon - Clickable to view */}
                <div 
                  className={`notif-icon-wrapper ${getIconBg(notification.type)}`}
                  onClick={() => handleViewNotification(notification)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view"
                >
                  {notification.isAdminBroadcast ? (
                    <FaBullhorn className="notif-icon-broadcast" />
                  ) : (
                    getIcon(notification.type)
                  )}
                </div>

                {/* Content - Clickable to view */}
                <div 
                  className="notif-content"
                  onClick={() => handleViewNotification(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="notif-content-header">
                    <div className="notif-title-wrapper">
                      <h4 className="notif-title">
                        {notification.title}
                      </h4>
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
                  
                  {/* Metadata display */}
                  {notification.metadata && notification.metadata.performedBy && (
                    <div className="notif-metadata">
                      <span className="notif-performed-by">
                        Performed by: {notification.metadata.performedBy}
                      </span>
                      {notification.metadata.bookingReference && (
                        <span className="notif-booking-ref">
                          Booking: {notification.metadata.bookingReference}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {!notification.read && (
                    <div className="notif-footer">
                      <button
                        className="notif-mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                      >
                        <FaCheck /> Mark as read
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions - 3 Dots Dropdown */}
                {!selectMode && (
                  <div className="notif-actions" ref={dropdownRef}>
                    <button
                      className="notif-menu-btn"
                      onClick={(e) => toggleDropdown(notification._id, e)}
                      title="More options"
                    >
                      <FaEllipsisV />
                    </button>

                    {activeDropdown === notification._id && (
                      <div className="notif-dropdown-menu">
                        <button
                          className="notif-dropdown-item view"
                          onClick={() => handleViewNotification(notification)}
                        >
                          <FaEye /> View
                        </button>
                        <button
                          className="notif-dropdown-item delete"
                          onClick={() => openDeleteModal(notification._id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination (same design as schedule module) */}
        {totalItems > 0 && (
          <div className="notif-footer-stats">
            {totalPages > 1 ? (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {startItem} to {endItem} of {totalItems} notifications
                  {getBroadcastCount() > 0 && ` • ${getBroadcastCount()} broadcast on this page`}
                </div>
                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft /> Previous
                  </button>
                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      className={`page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next <FaChevronRight />
                  </button>
                </div>
              </div>
            ) : (
              <span className="notif-stats">
                Showing {startItem} to {endItem} of {totalItems} notifications
                {getBroadcastCount() > 0 && ` • ${getBroadcastCount()} broadcast on this page`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
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