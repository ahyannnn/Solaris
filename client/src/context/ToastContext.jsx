// client/src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaTimes,
  FaBell,
  FaProjectDiagram,
  FaClipboardList,
  FaCalendarAlt,
  FaBullhorn,
  FaExternalLinkAlt
} from 'react-icons/fa';

const ToastContext = createContext(null);

const MAX_VISIBLE_TOASTS = 5;
const DEFAULT_DURATION = 5000;

// ============================================================
// HELPER: GET COLOR ACCENT BASED ON TYPE
// ============================================================
const getToastColor = (type) => {
  switch (type) {
    case 'success':
    case 'payment':
    case 'payment_success':
      return '#10B981'; // Green
    case 'error':
      return '#EF4444'; // Red
    case 'warning':
      return '#F59E0B'; // Amber
    case 'info':
      return '#3B82F6'; // Blue
    case 'project':
    case 'project_update':
      return '#0EA5E9'; // Sky blue
    case 'assessment':
    case 'site_assessment':
      return '#8B5CF6'; // Purple
    case 'schedule':
    case 'appointment':
      return '#F97316'; // Deep Orange
    case 'broadcast':
      return '#F39C12'; // Solaris Orange
    default:
      return '#F39C12'; // Solaris Orange primary default
  }
};

// ============================================================
// HELPER: GET ICON BASED ON TYPE
// ============================================================
const getToastIcon = (type, isBroadcast = false) => {
  if (isBroadcast) {
    return <FaBullhorn className="solaris-toast-icon" />;
  }

  switch (type) {
    case 'success':
    case 'payment':
    case 'payment_success':
      return <FaCheckCircle className="solaris-toast-icon" />;
    case 'error':
      return <FaTimesCircle className="solaris-toast-icon" />;
    case 'warning':
      return <FaExclamationTriangle className="solaris-toast-icon" />;
    case 'project':
    case 'project_update':
      return <FaProjectDiagram className="solaris-toast-icon" />;
    case 'assessment':
    case 'site_assessment':
      return <FaClipboardList className="solaris-toast-icon" />;
    case 'schedule':
    case 'appointment':
      return <FaCalendarAlt className="solaris-toast-icon" />;
    case 'info':
      return <FaInfoCircle className="solaris-toast-icon" />;
    default:
      return <FaBell className="solaris-toast-icon" />;
  }
};

// ============================================================
// SAFE LINK RESOLUTION
// Server historically sent legacy links (/pre-assessment/:id,
// /payment, /admin/..., /invoices/...) that have no route in
// App.jsx, so blind navigate(link) landed on a dead blank page.
// Resolve every link to a real /app/... route before navigating.
// ============================================================
const VALID_APP_PATHS = new Set([
  '/app/admin',
  '/app/admin/freequotes',
  '/app/admin/preassessments',
  '/app/admin/siteassessment',
  '/app/admin/project',
  '/app/admin/billing',
  '/app/admin/solarinvoices',
  '/app/admin/iotdevice',
  '/app/admin/reports',
  '/app/admin/schedule',
  '/app/admin/usermanagement',
  '/app/admin/settings',
  '/app/admin/maintenance',
  '/app/admin/system-config',
  '/app/admin/services',
  '/app/admin/notifications',
  '/app/engineer',
  '/app/engineer/assessment',
  '/app/engineer/project',
  '/app/engineer/device',
  '/app/engineer/reports',
  '/app/engineer/quotation',
  '/app/engineer/schedule',
  '/app/engineer/profile',
  '/app/engineer/notifications',
  '/app/customer',
  '/app/customer/project',
  '/app/customer/book-assessment',
  '/app/customer/billing',
  '/app/customer/support',
  '/app/customer/my-requests',
  '/app/customer/profile',
  '/app/customer/settings',
  '/app/customer/payment-success',
  '/app/customer/payment-cancel',
  '/app/customer/notifications',
]);

const getStoredRole = () => {
  try {
    return (
      localStorage.getItem('userRole') ||
      sessionStorage.getItem('userRole') ||
      'user'
    );
  } catch {
    return 'user';
  }
};

const getNotificationsPathForRole = (role) => {
  if (role === 'admin') return '/app/admin/notifications';
  if (role === 'engineer') return '/app/engineer/notifications';
  return '/app/customer/notifications';
};

// Map legacy/dead content to a valid page for the current role.
// Mirrors the smart routing in pages/Auth/notification.jsx.
const mapContentToValidPath = (combinedText, role) => {
  const t = (combinedText || '').toLowerCase();
  if (role === 'admin') {
    if (t.includes('billing') || t.includes('invoice') || t.includes('payment') || t.includes('receipt') || t.includes('solarinvoice')) return '/app/admin/billing';
    if (t.includes('project')) return '/app/admin/project';
    if (t.includes('pre-assessment') || t.includes('preassessment') || t.includes('booking') || t.includes('free quote') || t.includes('freequote') || t.includes('quote') || t.includes('assessment')) return '/app/admin/siteassessment';
    if (t.includes('user') || t.includes('client') || t.includes('customer')) return '/app/admin/usermanagement';
    if (t.includes('device') || t.includes('iot') || t.includes('hardware')) return '/app/admin/iotdevice';
    if (t.includes('report') || t.includes('analytic')) return '/app/admin/reports';
    if (t.includes('schedule') || t.includes('appointment')) return '/app/admin/schedule';
    if (t.includes('maintenance')) return '/app/admin/maintenance';
    if (t.includes('service')) return '/app/admin/services';
    return '/app/admin/notifications';
  }
  if (role === 'engineer') {
    if (t.includes('quotation') || t.includes('billing') || t.includes('invoice') || t.includes('payment')) return '/app/engineer/quotation';
    if (t.includes('project')) return '/app/engineer/project';
    if (t.includes('schedule') || t.includes('appointment')) return '/app/engineer/schedule';
    if (t.includes('assessment')) return '/app/engineer/assessment';
    if (t.includes('device') || t.includes('iot')) return '/app/engineer/device';
    if (t.includes('report') || t.includes('analytic')) return '/app/engineer/reports';
    return '/app/engineer/notifications';
  }
  // customer (default)
  if (t.includes('quotation') || t.includes('billing') || t.includes('invoice') || t.includes('payment') || t.includes('bill') || t.includes('receipt') || t.includes('fee')) return '/app/customer/billing';
  if (t.includes('project') || t.includes('installation')) return '/app/customer/project';
  if (t.includes('schedule') || t.includes('assessment') || t.includes('booking') || t.includes('appointment')) return '/app/customer/book-assessment';
  if (t.includes('support') || t.includes('service') || t.includes('ticket') || t.includes('help')) return '/app/customer/support';
  if (t.includes('profile')) return '/app/customer/profile';
  if (t.includes('setting')) return '/app/customer/settings';
  return '/app/customer/notifications';
};

export const resolveToastLink = (rawLink, toast = {}) => {
  if (!rawLink || typeof rawLink !== 'string') return null;
  const trimmed = rawLink.trim();
  if (!trimmed) return null;

  // External URLs are not app routes — don't feed them to react-router.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const role = getStoredRole();
  const [pathPart] = trimmed.split(/[?#]/);
  const pathOnly = pathPart || '/';
  const lowerPath = pathOnly.toLowerCase();

  // Exact valid route (query string preserved) — allow through.
  if (VALID_APP_PATHS.has(pathOnly) || VALID_APP_PATHS.has(lowerPath)) {
    // Guard against cross-role links (e.g. customer toast carrying
    // an /app/admin/... link): remap to the same content for my role
    // instead of hitting the RoleRouteGuard / dead page.
    const isAdminLink = lowerPath.startsWith('/app/admin');
    const isEngineerLink = lowerPath.startsWith('/app/engineer');
    const isCustomerLink = lowerPath.startsWith('/app/customer');
    if (
      (isAdminLink && role !== 'admin') ||
      (isEngineerLink && role !== 'engineer') ||
      (isCustomerLink && role !== 'user')
    ) {
      const hint = `${trimmed} ${toast.title || ''} ${toast.message || ''} ${toast.type || ''}`;
      return mapContentToValidPath(hint, role);
    }
    return trimmed;
  }

  // Known dead spellings from older server code.
  if (lowerPath.includes('scheduleassessment')) {
    if (role === 'admin') return '/app/admin/siteassessment';
    if (role === 'engineer') return '/app/engineer/assessment';
    return '/app/customer/book-assessment';
  }
  if (lowerPath === '/app/admin/pre-assessments' || lowerPath.startsWith('/app/admin/pre-assessments')) {
    return '/app/admin/siteassessment';
  }

  // Any other legacy link (/pre-assessment*, /payment*, /free-quotes*,
  // /projects*, /invoices*, /admin/* without /app prefix, ...):
  // resolve by content so old DB notifications still land somewhere real.
  const hint = `${trimmed} ${toast.title || ''} ${toast.message || ''} ${toast.type || ''} ${toast?.notification?.title || ''} ${toast?.notification?.message || ''}`;
  return mapContentToValidPath(hint, role);
};

// ============================================================
// INDIVIDUAL TOAST ITEM (WITH RAF TIMER & HOVER PAUSE)
// ============================================================
const ToastItem = ({ toast, onDismiss, onNavigate }) => {
  const [isExiting, setIsExiting] = useState(false);
  const fuseRef = useRef(null);
  const rafIdRef = useRef(null);
  const exitTimeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const duration = toast.duration || DEFAULT_DURATION;
  const remainingRef = useRef(duration);
  const isClosingRef = useRef(false);

  const color = getToastColor(toast.type);
  const icon = getToastIcon(toast.type, toast.isAdminBroadcast);

  const stopAnimation = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const cleanupAll = useCallback(() => {
    stopAnimation();
    if (exitTimeoutRef.current !== null) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
  }, [stopAnimation]);

  const triggerClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    cleanupAll();

    if (fuseRef.current) {
      fuseRef.current.style.width = '0%';
    }

    setIsExiting(true);

    exitTimeoutRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, 320); // Matches exit animation duration
  }, [cleanupAll, onDismiss, toast.id]);

  const startAnimation = useCallback(() => {
    stopAnimation();

    const animate = (now) => {
      if (isClosingRef.current) return;

      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }

      const elapsed = now - startTimeRef.current;
      const activeRemaining = Math.max(0, remainingRef.current - elapsed);
      const percent = Math.max(0, Math.min(100, (activeRemaining / duration) * 100));

      if (fuseRef.current) {
        fuseRef.current.style.width = `${percent}%`;
      }

      if (activeRemaining <= 0) {
        remainingRef.current = 0;
        startTimeRef.current = null;
        triggerClose();
        return;
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);
  }, [duration, stopAnimation, triggerClose]);

  useEffect(() => {
    cleanupAll();
    isClosingRef.current = false;
    startTimeRef.current = null;
    remainingRef.current = duration;
    setIsExiting(false);

    if (fuseRef.current) {
      fuseRef.current.style.width = '100%';
    }

    startAnimation();

    return () => {
      cleanupAll();
    };
  }, [duration, cleanupAll, startAnimation]);

  // NOTE: hover-pause intentionally removed — the auto-dismiss timer
  // keeps running even while hovering so the toast never gets stuck
  // on screen.

  // Resolve once per toast so old DB entries with legacy links still
  // show as clickable, but always land on a real route.
  const resolvedLink = resolveToastLink(toast.link, toast);
  const isClickable = Boolean(resolvedLink || toast.onClick);

  const handleClick = (e) => {
    // If user clicked close button, do not navigate
    if (e.target.closest('.solaris-toast-close')) return;

    if (resolvedLink && onNavigate) {
      onNavigate(resolvedLink, toast);
      triggerClose();
    } else if (toast.onClick) {
      toast.onClick();
      triggerClose();
    }
  };

  return (
    <div
      className={`solaris-toast-item ${isExiting ? 'solaris-toast-exit' : 'solaris-toast-enter'} ${
        isClickable ? 'solaris-toast-clickable' : ''
      }`}
      style={{
        borderLeftColor: color,
      }}
      onClick={handleClick}
      role="alert"
      aria-live="assertive"
    >
      {/* ICON */}
      <div
        className="solaris-toast-icon-wrapper"
        style={{
          color: color,
          backgroundColor: `${color}15`,
        }}
      >
        {icon}
      </div>

      {/* BODY CONTENT */}
      <div className="solaris-toast-body">
        {toast.title && (
          <div className="solaris-toast-title">
            <span>{toast.title}</span>
            {isClickable && <FaExternalLinkAlt className="solaris-toast-link-icon" />}
          </div>
        )}
        <div className="solaris-toast-message">{toast.message}</div>
        <div className="solaris-toast-meta">
          <span className="solaris-toast-time">Just now</span>
          {isClickable && <span className="solaris-toast-action-hint">• Click to open</span>}
        </div>
      </div>

      {/* DISMISS BUTTON */}
      <button
        type="button"
        className="solaris-toast-close"
        onClick={(e) => {
          e.stopPropagation();
          triggerClose();
        }}
        aria-label="Close notification"
      >
        <FaTimes />
      </button>

      {/* AUTO-DISMISS PROGRESS TRACK */}
      <div className="solaris-toast-progress-track">
        <div
          ref={fuseRef}
          className="solaris-toast-progress-fuse"
          style={{
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

// ============================================================
// STACK CONTAINER
// ============================================================
export const ToastContainer = () => {
  const context = useContext(ToastContext);
  const navigate = useNavigate();

  if (!context) return null;

  const { toasts, removeToast } = context;

  if (!toasts || toasts.length === 0) return null;

  const handleNavigate = (link, toast) => {
    if (!link) return;
    // External URL — leave the SPA safely.
    if (/^https?:\/\//i.test(link)) {
      window.open(link, '_blank', 'noopener,noreferrer');
      return;
    }
    // Re-resolve defensively (covers toasts created before this fix
    // that are still sitting in old DB rows) and never push a dead
    // route — fall back to my role's notifications page.
    const safeLink = resolveToastLink(link, toast) || getNotificationsPathForRole(getStoredRole());
    try {
      navigate(safeLink);
    } catch {
      navigate(getNotificationsPathForRole(getStoredRole()));
    }
  };

  return (
    <div className="solaris-toast-container" aria-label="Notifications Stack">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={removeToast}
          onNavigate={handleNavigate}
        />
      ))}
    </div>
  );
};

// ============================================================
// TOAST PROVIDER & CONTEXT
// ============================================================
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const seenNotificationIds = useRef(new Set());

  // Remove toast by ID
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Add a generic toast
  const addToast = useCallback((toastData) => {
    const id = toastData.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast = {
      ...toastData,
      id,
      duration: toastData.duration || DEFAULT_DURATION,
      createdAt: Date.now(),
    };

    setToasts((prev) => {
      // Prevent duplicate toast IDs in active stack
      if (prev.some((t) => t.id === id)) {
        return prev;
      }
      // Stack toasts, prioritizing newest and capping at MAX_VISIBLE_TOASTS
      const updated = [newToast, ...prev];
      if (updated.length > MAX_VISIBLE_TOASTS) {
        return updated.slice(0, MAX_VISIBLE_TOASTS);
      }
      return updated;
    });

    return id;
  }, []);

  // Show a standard toast message (compatible with legacy useToast)
  const showToast = useCallback(
    (message, type = 'success', duration = DEFAULT_DURATION, title = null, link = null) => {
      return addToast({
        title,
        message,
        type,
        duration,
        link,
      });
    },
    [addToast]
  );

  // Show a real-time notification toast with strict duplicate prevention
  const showNotificationToast = useCallback(
    (notification, duration = 6000) => {
      if (!notification) return null;

      const notifId = notification._id || notification.id;

      // STRICT DUPLICATE PREVENTION:
      // If we've already generated a toast for this notification ID, ignore!
      if (notifId && seenNotificationIds.current.has(notifId.toString())) {
        console.log(`🛡️ [ToastContext] Suppressed duplicate toast for notification ${notifId}`);
        return null;
      }

      if (notifId) {
        seenNotificationIds.current.add(notifId.toString());
        // Cap seen IDs memory to last 500
        if (seenNotificationIds.current.size > 500) {
          const firstKey = seenNotificationIds.current.values().next().value;
          seenNotificationIds.current.delete(firstKey);
        }
      }

      // Title mapping based on type
      let defaultTitle = 'New Notification';
      const type = (notification.type || notification.notificationType || '').toLowerCase();
      if (type.includes('payment')) defaultTitle = 'Payment Update';
      else if (type.includes('project')) defaultTitle = 'Project Update';
      else if (type.includes('assessment')) defaultTitle = 'Site Assessment';
      else if (type.includes('schedule')) defaultTitle = 'Schedule Notice';
      else if (type.includes('warning')) defaultTitle = 'Attention Required';
      else if (type.includes('error')) defaultTitle = 'System Alert';
      else if (notification.isAdminBroadcast) defaultTitle = 'Admin Broadcast';

      const title = notification.title || defaultTitle;
      const message = notification.message || 'You have received a new update.';
      const link = notification.link || '';

      return addToast({
        id: notifId ? `notif-${notifId}` : undefined,
        title,
        message,
        type: notification.type || 'info',
        isAdminBroadcast: notification.isAdminBroadcast === true,
        duration,
        link,
        notification,
      });
    },
    [addToast]
  );

  const value = {
    toasts,
    addToast,
    showToast,
    showNotificationToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// ============================================================
// HOOKS
// ============================================================
export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

/**
 * Reusable hook compatible with existing component code
 * Can be used with or without ToastProvider
 */
export const useToast = (
  initialState = {
    show: false,
    message: '',
    type: 'success',
    duration: 5000,
  }
) => {
  const context = useContext(ToastContext);
  const [localToast, setLocalToast] = useState(initialState);

  // If used inside ToastProvider, dispatch to global stackable container
  if (context) {
    return {
      toast: localToast,
      showToast: context.showToast,
      showNotificationToast: context.showNotificationToast,
      hideToast: context.clearAllToasts,
      setToast: setLocalToast,
    };
  }

  // Fallback for standalone/isolated use
  const showToast = (message, type = 'success', duration = 5000) => {
    setLocalToast({
      show: true,
      message,
      type,
      duration,
    });
  };

  const hideToast = () => {
    setLocalToast({
      show: false,
      message: '',
      type: 'success',
      duration: 5000,
    });
  };

  return {
    toast: localToast,
    showToast,
    hideToast,
    setToast: setLocalToast,
  };
};

// ============================================================
// INJECT LIGHT MODE TOAST CSS
// ============================================================
const solarisToastStyles = `
/* ============================================================
   SOLARIS REUSABLE STACKABLE TOAST CONTAINER (LIGHT THEME)
============================================================ */

.solaris-toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
  max-width: 420px;
  width: 100%;
}

/* ============================================================
   INDIVIDUAL STACKABLE TOAST ITEM
============================================================ */

/* Toasts are always black theme by design — same look in
   light mode and dark mode. */
.solaris-toast-item {
  position: relative;
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.25rem 1.125rem 1rem;
  background: #1A2533;
  color: #F9FAFB;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 5px solid #F39C12;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}

.solaris-toast-item.solaris-toast-clickable {
  cursor: pointer;
}

.solaris-toast-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px -5px rgba(0, 0, 0, 0.6);
}

/* Enter Animation */
.solaris-toast-enter {
  animation: solarisToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Exit Animation */
.solaris-toast-exit {
  animation: solarisToastSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes solarisToastSlideIn {
  0% {
    opacity: 0;
    transform: translateX(40px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes solarisToastSlideOut {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
    max-height: 140px;
    margin-bottom: 0;
  }
  100% {
    opacity: 0;
    transform: translateX(50px) scale(0.92);
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-bottom: -0.75rem;
  }
}

/* ============================================================
   ICON
============================================================ */

.solaris-toast-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.125rem;
  margin-top: 2px;
}

.solaris-toast-icon {
  font-size: 1.125rem;
}

/* ============================================================
   CONTENT
============================================================ */

.solaris-toast-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.solaris-toast-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #F9FAFB;
  line-height: 1.25;
}

.solaris-toast-link-icon {
  font-size: 0.6875rem;
  color: #9CA3AF;
  transition: color 0.15s ease;
}

.solaris-toast-clickable:hover .solaris-toast-link-icon {
  color: #F39C12;
}

.solaris-toast-message {
  font-size: 0.8125rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.45;
  word-break: break-word;
}

.solaris-toast-meta {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  color: #9CA3AF;
  margin-top: 0.125rem;
}

.solaris-toast-action-hint {
  color: #F39C12;
  font-weight: 500;
}

/* ============================================================
   CLOSE BUTTON
============================================================ */

.solaris-toast-close {
  background: transparent;
  border: none;
  color: #9CA3AF;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-size: 0.75rem;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.solaris-toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
}

/* ============================================================
   PROGRESS BAR
============================================================ */

.solaris-toast-progress-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.solaris-toast-progress-fuse {
  height: 100%;
  width: 100%;
  border-radius: 0 0 12px 12px;
  will-change: width;
}

/* NOTE: no dark-mode overrides — toasts are always black theme
   (see base styles above), in both light and dark mode. */

/* ============================================================
   RESPONSIVE DESIGN
============================================================ */

@media (max-width: 640px) {
  .solaris-toast-container {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    width: auto;
    max-width: none;
    gap: 0.5rem;
  }

  .solaris-toast-item {
    padding: 0.875rem 1rem 1rem 0.875rem;
  }
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'solaris-stackable-toast-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = solarisToastStyles;
    document.head.appendChild(style);
  }
}

export default ToastProvider;
