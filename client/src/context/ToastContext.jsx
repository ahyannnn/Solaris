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
  const isPausedRef = useRef(false);
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
    isPausedRef.current = false;
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
      if (isClosingRef.current || isPausedRef.current) return;

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
    isPausedRef.current = false;
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

  const handleMouseEnter = () => {
    if (isClosingRef.current || isPausedRef.current) return;

    if (startTimeRef.current !== null) {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }

    startTimeRef.current = null;
    isPausedRef.current = true;
    stopAnimation();

    const frozenPercent = Math.max(0, Math.min(100, (remainingRef.current / duration) * 100));
    if (fuseRef.current) {
      fuseRef.current.style.width = `${frozenPercent}%`;
    }
  };

  const handleMouseLeave = () => {
    if (isClosingRef.current || !isPausedRef.current) return;

    if (remainingRef.current <= 0) {
      isPausedRef.current = false;
      triggerClose();
      return;
    }

    isPausedRef.current = false;
    startTimeRef.current = null;
    startAnimation();
  };

  const handleClick = (e) => {
    // If user clicked close button, do not navigate
    if (e.target.closest('.solaris-toast-close')) return;

    if (toast.link && onNavigate) {
      onNavigate(toast.link);
      triggerClose();
    } else if (toast.onClick) {
      toast.onClick();
      triggerClose();
    }
  };

  return (
    <div
      className={`solaris-toast-item ${isExiting ? 'solaris-toast-exit' : 'solaris-toast-enter'} ${
        toast.link ? 'solaris-toast-clickable' : ''
      }`}
      style={{
        borderLeftColor: color,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
            {toast.link && <FaExternalLinkAlt className="solaris-toast-link-icon" />}
          </div>
        )}
        <div className="solaris-toast-message">{toast.message}</div>
        <div className="solaris-toast-meta">
          <span className="solaris-toast-time">Just now</span>
          {toast.link && <span className="solaris-toast-action-hint">• Click to open</span>}
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

  const handleNavigate = (link) => {
    if (link) {
      navigate(link);
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

.solaris-toast-item {
  position: relative;
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.25rem 1.125rem 1rem;
  background: #FFFFFF;
  color: #111827;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  border-left: 5px solid #F39C12;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
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
  box-shadow: 0 14px 30px -5px rgba(0, 0, 0, 0.12), 0 10px 12px -6px rgba(0, 0, 0, 0.06);
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
  color: #111827;
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
  color: #4B5563;
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
  color: #111827;
  background: #F3F4F6;
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
  background: #F3F4F6;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.solaris-toast-progress-fuse {
  height: 100%;
  width: 100%;
  border-radius: 0 0 12px 12px;
  will-change: width;
}

/* ============================================================
   DARK MODE ADAPTATION (IF ENABLED)
============================================================ */

body.dark-mode .solaris-toast-item {
  background: #1A2533;
  color: #F9FAFB;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

body.dark-mode .solaris-toast-title {
  color: #F9FAFB;
}

body.dark-mode .solaris-toast-message {
  color: rgba(255, 255, 255, 0.75);
}

body.dark-mode .solaris-toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
}

body.dark-mode .solaris-toast-progress-track {
  background: rgba(255, 255, 255, 0.08);
}

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
